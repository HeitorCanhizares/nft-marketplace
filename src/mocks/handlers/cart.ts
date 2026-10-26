import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { cartSchema } from '@/schemas/cart'
import { positiveIntSchema } from '@/schemas/common'
import { addToCart, type AddToCartOwner } from '../db/cartAdd'
import { userCartId } from '../db/cartMerge'
import {
  applyCoupon,
  clearCoupon,
  removeItem,
  toCartResponse,
  updateItemQuantity,
} from '../db/cartOps'
import { cartsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { hasScenario } from '../scenarios/active'
import { withMock } from '../scenarios/middleware'
import { authenticate, readCartId } from './sessionGuard'

const addItemBodySchema = z.object({
  nftId: z.string({ error: 'Informe o NFT.' }).min(1, { error: 'Informe o NFT.' }),
  editionId: z.string({ error: 'Informe a edição.' }).min(1, { error: 'Informe a edição.' }),
  quantity: positiveIntSchema,
})

const updateItemBodySchema = z.object({
  quantity: positiveIntSchema,
})

const couponBodySchema = z.object({
  code: z
    .string({ error: 'Informe o código promocional.' })
    .trim()
    .min(1, { error: 'Informe o código promocional.' }),
})

// Com Authorization, o carrinho é o do usuário (sessão vencida devolve 401 SESSION_EXPIRED).
// Sem ele, é o carrinho do visitante identificado por X-Cart-Id. Null quando não há nenhum dos dois.
export async function resolveOwner(request: Request): Promise<AddToCartOwner | Response | null> {
  if (request.headers.has('Authorization')) {
    const auth = await authenticate(request)
    if (auth instanceof Response) return auth
    return { cartId: userCartId(auth.user.id), ownerId: auth.user.id }
  }

  const cartId = readCartId(request)
  return cartId === null ? null : { cartId, ownerId: cartId }
}

export const cartHandlers = [
  http.post(
    apiPath('/cart/items'),
    withMock('POST /cart/items', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = addItemBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner
      if (owner === null) {
        return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
      }

      const result = await addToCart(owner, parsed.data)
      if (!result.ok) {
        if (result.code === 'NOT_FOUND') {
          return apiError('NOT_FOUND', { message: result.message })
        }
        if (result.code === 'SOLD_OUT') {
          return apiError('SOLD_OUT', { message: result.message })
        }
        return apiError('QUANTITY_EXCEEDS_STOCK', {
          message: result.message,
          details: result.details,
        })
      }

      // Resposta com preço e estoque atuais, sem ownerId.
      return HttpResponse.json(await toCartResponse(result.cart))
    }),
  ),

  http.patch(
    apiPath('/cart/items/:itemId'),
    withMock('PATCH /cart/items/:itemId', async ({ request, params }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = updateItemBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner
      if (owner === null) {
        return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
      }

      const itemId = params.itemId
      if (typeof itemId !== 'string') return apiError('BAD_REQUEST')

      const result = await updateItemQuantity(owner.cartId, itemId, parsed.data.quantity)
      if (!result.ok) {
        return apiError(result.code, { message: result.message, details: result.details })
      }
      return HttpResponse.json(result.cart)
    }),
  ),

  http.delete(
    apiPath('/cart/items/:itemId'),
    withMock('DELETE /cart/items/:itemId', async ({ request, params }) => {
      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner
      if (owner === null) {
        return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
      }

      const itemId = params.itemId
      if (typeof itemId !== 'string') return apiError('BAD_REQUEST')

      const result = await removeItem(owner.cartId, itemId)
      if (!result.ok) {
        return apiError(result.code, { message: result.message, details: result.details })
      }
      return HttpResponse.json(result.cart)
    }),
  ),

  http.put(
    apiPath('/cart/coupon'),
    withMock('PUT /cart/coupon', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = couponBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner
      if (owner === null) {
        return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
      }

      const result = await applyCoupon(owner, parsed.data.code)
      if (!result.ok) return apiError(result.code, { message: result.message })
      return HttpResponse.json(result.cart)
    }),
  ),

  http.delete(
    apiPath('/cart/coupon'),
    withMock('DELETE /cart/coupon', async ({ request }) => {
      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner
      if (owner === null) {
        return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
      }

      return HttpResponse.json(await clearCoupon(owner.cartId))
    }),
  ),

  http.get(
    apiPath('/cart'),
    withMock('GET /cart', async ({ request }) => {
      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner

      // Visitante sem X-Cart-Id: carrinho vazio, sem gravar nada.
      if (owner === null) {
        return HttpResponse.json(
          cartSchema.parse({ id: 'guest-empty', items: [], itemCount: 0, version: 0 }),
        )
      }

      const empty = { id: owner.cartId, items: [], itemCount: 0, version: 0 }
      if (hasScenario('empty-cart')) return HttpResponse.json(cartSchema.parse(empty))

      const record = await cartsStore.get(owner.cartId)
      if (record === undefined) return HttpResponse.json(cartSchema.parse(empty))

      // Preço e estoque lidos agora; nada é gravado.
      return HttpResponse.json(await toCartResponse(record))
    }),
  ),
]
