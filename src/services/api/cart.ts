import { cartSchema } from '@/schemas/cart'
import type { Cart } from '@/types/cart'
import { get, post } from '@/services/http/validate'

export type AddCartItemInput = { nftId: string; editionId: string; quantity: number }

export function addCartItem(input: AddCartItemInput): Promise<Cart> {
  return post('/cart/items', cartSchema, input)
}

export function getCart(signal?: AbortSignal): Promise<Cart> {
  return get('/cart', cartSchema, { signal })
}
