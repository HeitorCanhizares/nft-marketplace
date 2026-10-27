import { HTTP_TIMEOUT_MS } from '@/services/http/client'
import type { Quote } from '@/types/cart'
import { triggerPriceChange, triggerStockChange } from '../realtime/scheduler'
import { hasScenario } from '../scenarios/active'
import { mockConfig } from '../scenarios/config'
import { wait } from '../scenarios/latency'
import { ethToUnits, unitsToEth } from './money'
import { quotesStore } from './stores'

// Cenários do checkout que valem uma vez. Estado em memória do módulo: some ao recarregar a página.
type CheckoutScenario =
  | 'session-expired-on-checkout'
  | 'price-change-on-checkout'
  | 'sold-out-on-checkout'
  | 'coupon-expires-on-checkout'
  | 'fee-change-on-checkout'
  | 'realtime-drop'

const PAYMENT_SLOW_DELAY_MS = 30_000
export const REALTIME_DROP_MS = 6000

const consumed = new Set<string>()
const forcedQuoteIds = new Set<string>()

// Passos fixos das contas em unidades de 0,000001 ETH.
const PRICE_STEP_UNITS = 10_000 // 0,01 ETH
const FEE_STEP_UNITS = 1_000 // 0,001 ETH
const ORDER_HOLD_EXTRA_MS = 3000

// Devolve true só na primeira vez que o cenário está ativo.
function fire(name: CheckoutScenario): boolean {
  if (!hasScenario(name) || consumed.has(name)) return false
  consumed.add(name)
  return true
}

export function isForcedQuote(quoteId: string): boolean {
  return forcedQuoteIds.has(quoteId)
}

export function maybeSessionExpired(): boolean {
  return fire('session-expired-on-checkout')
}

// Altera preço ou estoque antes da revalidação; a revalidação normal encontra a mudança.
export async function perturbBeforeRevalidation(stored: Quote): Promise<void> {
  const priced = stored.items.find((item) => item.availability !== 'sold_out')
  if (priced !== undefined && fire('price-change-on-checkout')) {
    const newPrice = unitsToEth(ethToUnits(priced.unitPrice) + PRICE_STEP_UNITS)
    await triggerPriceChange(priced.nft.id, priced.edition.id, newPrice)
  }

  const finite = stored.items.find((item) => item.available !== null)
  if (finite !== undefined && fire('sold-out-on-checkout')) {
    await triggerStockChange(finite.nft.id, finite.edition.id, 0)
  }
}

// Devolve uma cotação forçada com cupom vencido ou taxa maior; null quando nenhum cenário vale.
export async function forceQuoteChange(fresh: Quote): Promise<Quote | null> {
  if (fresh.coupon?.status === 'applied' && fire('coupon-expires-on-checkout')) {
    return remember({
      ...fresh,
      id: 'quote-' + crypto.randomUUID(),
      discount: unitsToEth(0),
      total: unitsToEth(ethToUnits(fresh.subtotal) + ethToUnits(fresh.networkFee)),
      coupon: {
        code: fresh.coupon.code,
        status: 'expired',
        message: 'Este código promocional expirou.',
      },
    })
  }

  if (fire('fee-change-on-checkout')) {
    const networkFee = unitsToEth(ethToUnits(fresh.networkFee) + FEE_STEP_UNITS)
    return remember({
      ...fresh,
      id: 'quote-' + crypto.randomUUID(),
      networkFee,
      total: unitsToEth(
        ethToUnits(fresh.subtotal) - ethToUnits(fresh.discount) + ethToUnits(networkFee),
      ),
    })
  }

  return null
}

async function remember(forced: Quote): Promise<Quote> {
  await quotesStore.put(forced)
  forcedQuoteIds.add(forced.id)
  return forced
}

// Segura a resposta depois de gravar o pedido: o cliente estoura o timeout e tenta de novo com a mesma chave.
export async function holdAfterCreate(key: string): Promise<void> {
  const marker = `order-timeout:${key}`
  if (!hasScenario('order-timeout') || consumed.has(marker)) return
  consumed.add(marker)
  await wait(HTTP_TIMEOUT_MS + ORDER_HOLD_EXTRA_MS)
}

// Atraso até o pedido sair de pending: 30 s com payment-slow; senão, VITE_MOCK_PAYMENT_DELAY_MS.
export function paymentDelayMs(): number {
  if (hasScenario('payment-slow')) return PAYMENT_SLOW_DELAY_MS
  return mockConfig.paymentDelayMs
}

// Desfecho do pagamento: os cenários forçam; senão sorteia com VITE_MOCK_PAYMENT_DECLINE_RATE.
export function paymentOutcome(): 'confirmed' | 'declined' {
  if (hasScenario('payment-declined')) return 'declined'
  if (hasScenario('payment-confirmed')) return 'confirmed'
  return Math.random() < mockConfig.paymentDeclineRate ? 'declined' : 'confirmed'
}

// Vale em toda chamada, não só na primeira.
export function isForbiddenOrderScenario(): boolean {
  return hasScenario('forbidden-order')
}

// Uma vez por carga da página.
export function shouldDropRealtime(): boolean {
  return fire('realtime-drop')
}
