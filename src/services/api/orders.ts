import { quoteSchema } from '@/schemas/cart'
import { orderSchema, ordersSchema, quoteChangedDetailsSchema } from '@/schemas/order'
import type { CreateOrderInput, Order } from '@/types/order'
import type { Quote } from '@/types/cart'
import type { Network, WalletProvider } from '@/types/nft'
import { get, post } from '@/services/http/validate'
import { isApiError } from '@/services/http/ApiError'

export function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<Order> {
  return post('/orders', orderSchema, input, {
    headers: { 'Idempotency-Key': idempotencyKey },
    signal,
  })
}

export function getPendingOrders(signal?: AbortSignal): Promise<Order[]> {
  return get('/orders', ordersSchema, { params: { status: 'pending' }, signal })
}

export function getCheckoutQuote(
  input: { network?: Network; provider?: WalletProvider },
  signal?: AbortSignal,
): Promise<Quote> {
  return post('/quote', quoteSchema, input, { signal })
}

// Cotação nova devolvida no 409 QUOTE_CHANGED; null para qualquer outro erro.
export function readQuoteChanged(error: unknown): Quote | null {
  if (!isApiError(error) || error.code !== 'QUOTE_CHANGED') return null
  const parsed = quoteChangedDetailsSchema.safeParse(error.details)
  return parsed.success ? parsed.data.quote : null
}
