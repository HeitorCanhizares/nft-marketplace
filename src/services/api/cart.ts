import { cartSchema, quoteSchema } from '@/schemas/cart'
import type { Cart, Quote } from '@/types/cart'
import { del, get, post, put, patch } from '@/services/http/validate'

export type AddCartItemInput = { nftId: string; editionId: string; quantity: number }

export function addCartItem(input: AddCartItemInput): Promise<Cart> {
  return post('/cart/items', cartSchema, input)
}

export function getCart(signal?: AbortSignal): Promise<Cart> {
  return get('/cart', cartSchema, { signal })
}

export function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return patch(`/cart/items/${encodeURIComponent(itemId)}`, cartSchema, { quantity })
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return del(`/cart/items/${encodeURIComponent(itemId)}`, cartSchema)
}

export function applyCartCoupon(code: string): Promise<Cart> {
  return put('/cart/coupon', cartSchema, { code })
}

export function removeCartCoupon(): Promise<Cart> {
  return del('/cart/coupon', cartSchema)
}

export function getQuote(signal?: AbortSignal): Promise<Quote> {
  return post('/quote', quoteSchema, {}, { signal })
}
