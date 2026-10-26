import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { cartSchema } from '@/schemas/cart'
import { positiveIntSchema } from '@/schemas/common'
import type { CartItem } from '@/types/cart'
import { addToCart, type AddToCartOwner } from '../db/cartAdd'
import { userCartId } from '../db/cartMerge'
import { cartsStore, nftsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { hasScenario } from '../scenarios/active'
import { withMock } from '../scenarios/middleware'
import { authenticate, readCartId } from './sessionGuard'

const LOW_STOCK_THRESHOLD = 3

const addItemBodySchema = z.object({
  nftId: z.string({ error: 'Informe o NFT.' }).min(1, { error: 'Informe o NFT.' }),
  editionId: z.string({ error: 'Informe a edição.' }).min(1, { error: 'Informe a edição.' }),
  quantity: positiveIntSchema,
})

// Com Authorization, o carrinho é o do usuário (sessão vencida devolve 401 SESSION_EXPIRED).
// Sem ele, é o carrinho do visitante identificado por X-Cart-Id. Null quando não há nenhum dos dois.
async function resolveOwner(request: Request): Promise<AddToCartOwner | Response | null> {
  if (request.headers.has('Authorization')) {
    const auth = await authenticate(request)
    if (auth instanceof Response) return auth
    return { cartId: userCartId(auth.user.id), ownerId: auth.user.id }
  }

  const cartId = readCartId(request)
  return cartId === null ? null : { cartId, ownerId: cartId }
}

function availabilityOf(available: number | null, quantity: number): CartItem['availability'] {
  if (available === null) return 'available'
  if (available === 0) return 'sold_out'
  if (available < quantity) return 'insufficient'
  if (available <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'available'
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

      // Resposta sem ownerId: é dado interno do mock.
      const { id, items, itemCount, version, coupon } = result.cart
      return HttpResponse.json({
        id,
        items,
        itemCount,
        version,
        ...(coupon === undefined ? {} : { coupon }),
      })
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

      // Estoque lido agora: disponibilidade recalculada. Linha de NFT que não existe mais é omitida.
      const items: CartItem[] = []
      for (const line of record.items) {
        const nft = await nftsStore.get(line.nft.id)
        if (nft === undefined) continue

        const edition = nft.editions.find((candidate) => candidate.id === line.edition.id)
        const available = edition === undefined ? line.available : edition.available
        items.push({ ...line, available, availability: availabilityOf(available, line.quantity) })
      }

      // Resposta sem ownerId: cartSchema descarta campos internos.
      return HttpResponse.json(
        cartSchema.parse({
          id: record.id,
          items,
          itemCount: items.reduce((total, item) => total + item.quantity, 0),
          version: record.version,
          ...(record.coupon === undefined ? {} : { coupon: record.coupon }),
        }),
      )
    }),
  ),
]
