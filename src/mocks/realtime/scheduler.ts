import type { Edition } from '../../types/nft'
import type { NftRecord } from '../db/db'
import { nftsStore } from '../db/stores'
import { getActiveScenarios } from '../scenarios/active'
import { isTestMode, mockConfig } from '../scenarios/config'
import {
  emitToNftSubscribers,
  getSubscribedNftIds,
  type NftPriceChangedPayload,
  type NftStockChangedPayload,
} from './server'

const MIN_TICK_MS = 20_000
const MAX_TICK_MS = 40_000
const MIN_PERCENT = 5
const MAX_PERCENT = 15

// Preços são guardados como string decimal; a aritmética é feita em unidades de 0,000001 ETH.
const UNITS_PER_ETH = 1_000_000n
const PRICE_PATTERN = /^(\d+)(?:\.(\d{1,6}))?$/

let running = false
let timer: ReturnType<typeof setTimeout> | null = null

function parsePrice(price: string): bigint {
  const match = PRICE_PATTERN.exec(price)
  if (match === null) {
    throw new Error(`Preço inválido: "${price}".`)
  }
  const [, whole, fraction = ''] = match
  return BigInt(whole) * UNITS_PER_ETH + BigInt(fraction.padEnd(6, '0'))
}

// Mínimo de duas casas, como no seed ("1.19"); casas extras só quando existem ("1.309").
function formatPrice(units: bigint): string {
  const whole = units / UNITS_PER_ETH
  const fraction = (units % UNITS_PER_ETH)
    .toString()
    .padStart(6, '0')
    .replace(/0+$/, '')
    .padEnd(2, '0')
  return `${whole}.${fraction}`
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]
}

// Preço do NFT = menor preço entre as edições com estoque; se esgotado, menor entre todas.
// Se o preço mudar, o anterior vira previousPrice.
function refreshSummaryPrice(nft: NftRecord): void {
  const sellable = nft.editions.filter(
    (edition) => edition.available === null || edition.available > 0,
  )
  const source = sellable.length > 0 ? sellable : nft.editions
  if (source.length === 0) {
    return
  }
  const lowest = source
    .map((edition) => parsePrice(edition.price))
    .reduce((min, price) => (price < min ? price : min))
  const next = formatPrice(lowest)
  if (next !== nft.price) {
    nft.previousPrice = nft.price
    nft.price = next
  }
}

function isSchedulerEnabled(): boolean {
  return mockConfig.realtimeEnabled && !isTestMode && getActiveScenarios().length === 0
}

async function requireNft(nftId: string): Promise<NftRecord> {
  const nft = await nftsStore.get(nftId)
  if (nft === undefined) {
    throw new Error(`NFT não encontrado: "${nftId}".`)
  }
  return nft
}

function requireEdition(nft: NftRecord, editionId: string): Edition {
  const edition = nft.editions.find((item) => item.id === editionId)
  if (edition === undefined) {
    throw new Error(`Edição não encontrada: "${editionId}" no NFT "${nft.id}".`)
  }
  return edition
}

async function commitPrice(
  nft: NftRecord,
  edition: Edition,
  newPrice: string,
): Promise<NftPriceChangedPayload> {
  const previousPrice = edition.price
  edition.price = newPrice
  refreshSummaryPrice(nft)
  await nftsStore.put(nft)
  return { nftId: nft.id, editionId: edition.id, price: newPrice, previousPrice }
}

async function commitStock(
  nft: NftRecord,
  edition: Edition,
  available: number,
): Promise<NftStockChangedPayload> {
  edition.available = available
  refreshSummaryPrice(nft)
  await nftsStore.put(nft)
  return { nftId: nft.id, editionId: edition.id, available }
}

async function oscillatePrice(nft: NftRecord): Promise<NftPriceChangedPayload | null> {
  const edition = pick(nft.editions)
  const current = parsePrice(edition.price)
  const sign = Math.random() < 0.5 ? -1n : 1n
  const percent = BigInt(randomInt(MIN_PERCENT, MAX_PERCENT)) * sign
  const next = current + (current * percent) / 100n
  if (next === current) {
    return null
  }
  return commitPrice(nft, edition, formatPrice(next))
}

async function oscillateStock(nft: NftRecord): Promise<NftStockChangedPayload | null> {
  // Cada opção é uma edição limitada com um ajuste válido (-1 com estoque, +1 abaixo do supply).
  const options: { edition: Edition; available: number }[] = []
  for (const edition of nft.editions) {
    if (edition.available === null) {
      continue
    }
    if (edition.available > 0) {
      options.push({ edition, available: edition.available - 1 })
    }
    if (edition.supply === null || edition.available < edition.supply) {
      options.push({ edition, available: edition.available + 1 })
    }
  }
  if (options.length === 0) {
    return null
  }
  const choice = pick(options)
  return commitStock(nft, choice.edition, choice.available)
}

async function tick(): Promise<void> {
  const subscribed = getSubscribedNftIds()
  if (subscribed.length === 0) {
    return
  }
  const nft = await nftsStore.get(pick(subscribed))
  if (nft === undefined || nft.editions.length === 0) {
    return
  }

  if (Math.random() < 0.5) {
    const stock = await oscillateStock(nft)
    if (stock !== null) {
      emitToNftSubscribers('nft:stock_changed', stock)
      return
    }
  }
  const price = await oscillatePrice(nft)
  if (price !== null) {
    emitToNftSubscribers('nft:price_changed', price)
  }
}

async function runTick(): Promise<void> {
  try {
    if (isSchedulerEnabled()) {
      await tick()
    }
  } catch (error) {
    console.error('Falha no agendador de oscilações do mock.', error)
  }
}

function scheduleNext(): void {
  timer = setTimeout(
    async () => {
      timer = null
      await runTick()
      if (running) {
        scheduleNext()
      }
    },
    randomInt(MIN_TICK_MS, MAX_TICK_MS),
  )
}

export function startScheduler(): void {
  if (running || !isSchedulerEnabled()) {
    return
  }
  running = true
  scheduleNext()
}

export function stopScheduler(): void {
  running = false
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

// Usado pelos cenários (ex.: price-change-on-checkout). Grava e emite sempre, sem sortear nada.
export async function triggerPriceChange(
  nftId: string,
  editionId: string,
  newPrice: string,
): Promise<void> {
  const nft = await requireNft(nftId)
  const edition = requireEdition(nft, editionId)
  const payload = await commitPrice(nft, edition, formatPrice(parsePrice(newPrice)))
  emitToNftSubscribers('nft:price_changed', payload)
}

// Usado pelos cenários (ex.: sold-out-on-checkout). Edição aberta não tem estoque para mudar.
export async function triggerStockChange(
  nftId: string,
  editionId: string,
  available: number,
): Promise<void> {
  if (!Number.isInteger(available) || available < 0) {
    throw new Error(`Estoque inválido: ${available}.`)
  }
  const nft = await requireNft(nftId)
  const edition = requireEdition(nft, editionId)
  if (edition.available === null) {
    throw new Error(`Edição "${editionId}" é aberta e não tem estoque.`)
  }
  const payload = await commitStock(nft, edition, available)
  emitToNftSubscribers('nft:stock_changed', payload)
}
