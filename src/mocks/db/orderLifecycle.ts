import { buildExplorerUrl } from '@/lib/explorerUrl'
import type { OrderItemSnapshot } from '@/types/order'
import { triggerStockChange } from '../realtime/scheduler'
import { emitOrderUpdated } from '../realtime/server'
import { userCartId } from './cartMerge'
import type { CartRecord, OrderRecord } from './db'
import { multiplyEth } from './money'
import { paymentDelayMs, paymentOutcome } from './orderScenarios'
import { cartsStore, nftsStore, ordersStore } from './stores'

export const DECLINE_REASON = 'Pagamento recusado pela carteira simulada.'
const STOCK_DECLINE_REASON = 'Um dos NFTs esgotou durante o pagamento.'

// Uma execução por pedido ao mesmo tempo: chamadas concorrentes recebem a mesma promessa.
const inFlight = new Map<string, Promise<OrderRecord | undefined>>()

// Pedidos com liquidação agendada nesta aba.
const armed = new Set<string>()

// 0x + 64 hexadecimais (32 bytes).
export function newTxHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return '0x' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function finishDeclined(record: OrderRecord, declineReason: string): Promise<OrderRecord> {
  const updated: OrderRecord = { ...record, status: 'declined', declineReason }
  await ordersStore.put(updated)
  emitOrderUpdated(record.id, { status: 'declined', declineReason })
  return updated
}

// Tira do carrinho só as quantidades compradas; o que foi adicionado depois continua.
export async function removePurchased(userId: string, items: OrderItemSnapshot[]): Promise<void> {
  const cart = await cartsStore.get(userCartId(userId))
  if (cart === undefined) return

  const lines = [...cart.items]
  for (const purchased of items) {
    const index = lines.findIndex(
      (line) => line.nft.id === purchased.nftId && line.edition.id === purchased.editionId,
    )
    if (index === -1) continue

    const line = lines[index]
    const remaining = line.quantity - purchased.quantity
    if (remaining > 0) {
      lines[index] = {
        ...line,
        quantity: remaining,
        lineTotal: multiplyEth(line.unitPrice, remaining),
      }
    } else {
      lines.splice(index, 1)
    }
  }

  // Cupom sai quando o carrinho fica vazio; fica quando sobra algo.
  const updated: CartRecord =
    lines.length === 0
      ? {
          id: cart.id,
          ownerId: cart.ownerId,
          items: lines,
          itemCount: 0,
          version: cart.version + 1,
        }
      : {
          ...cart,
          items: lines,
          itemCount: lines.reduce((total, line) => total + line.quantity, 0),
          version: cart.version + 1,
        }
  await cartsStore.put(updated)
}

async function runSettlement(orderId: string): Promise<OrderRecord | undefined> {
  const record = await ordersStore.get(orderId)
  if (record === undefined || record.status !== 'pending') return record

  if (paymentOutcome() === 'declined') {
    return finishDeclined(record, DECLINE_REASON)
  }

  // Confere o estoque atual antes de baixar qualquer edição.
  const limited: { item: OrderItemSnapshot; available: number }[] = []
  for (const item of record.items) {
    const nft = await nftsStore.get(item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (edition === undefined || edition.available === null) continue
    if (edition.available < item.quantity) {
      return finishDeclined(record, STOCK_DECLINE_REASON)
    }
    limited.push({ item, available: edition.available })
  }

  for (const { item, available } of limited) {
    await triggerStockChange(item.nftId, item.editionId, available - item.quantity)
  }

  await removePurchased(record.userId, record.items)

  const txHash = newTxHash()
  const updated: OrderRecord = {
    ...record,
    status: 'confirmed',
    txHash,
    explorerUrl: buildExplorerUrl(record.network, txHash),
  }
  await ordersStore.put(updated)
  emitOrderUpdated(record.id, { status: 'confirmed', txHash })
  return updated
}

// Liquida o pedido se ainda estiver pending. Devolve o registro como ficou.
export function settleOrder(orderId: string): Promise<OrderRecord | undefined> {
  const running = inFlight.get(orderId)
  if (running !== undefined) return running

  const task = runSettlement(orderId).finally(() => {
    inFlight.delete(orderId)
  })
  inFlight.set(orderId, task)
  return task
}

// Liquidação preguiçosa: quem consulta depois do prazo recebe o estado certo (ex.: após refresh).
export async function settleIfDue(record: OrderRecord): Promise<OrderRecord> {
  if (record.status !== 'pending') return record
  if (Date.now() < Date.parse(record.createdAt) + paymentDelayMs()) return record
  return (await settleOrder(record.id)) ?? record
}

// Agenda a liquidação para o tempo que falta. Idempotente por pedido.
export function armSettlement(record: OrderRecord): void {
  if (record.status !== 'pending' || armed.has(record.id)) return
  armed.add(record.id)

  const remaining = Math.max(0, Date.parse(record.createdAt) + paymentDelayMs() - Date.now())
  setTimeout(() => {
    settleOrder(record.id).catch((error: unknown) => {
      console.error('Falha ao liquidar pedido simulado:', error)
    })
  }, remaining)
}
