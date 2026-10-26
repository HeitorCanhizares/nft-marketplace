import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { positiveIntSchema } from '@/schemas/common'
import { addToCart, type AddToCartOwner } from '../db/cartAdd'
import { userCartId } from '../db/cartMerge'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate, readCartId } from './sessionGuard'

const addItemBodySchema = z.object({
  nftId: z.string({ error: 'Informe o NFT.' }).min(1, { error: 'Informe o NFT.' }),
  editionId: z.string({ error: 'Informe a edição.' }).min(1, { error: 'Informe a edição.' }),
  quantity: positiveIntSchema,
})

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

      // Com Authorization, o carrinho é o do usuário (sessão vencida devolve 401 SESSION_EXPIRED).
      // Sem ele, é o carrinho do visitante identificado por X-Cart-Id.
      let owner: AddToCartOwner
      if (request.headers.has('Authorization')) {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth
        owner = { cartId: userCartId(auth.user.id), ownerId: auth.user.id }
      } else {
        const cartId = readCartId(request)
        if (cartId === null) {
          return apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })
        }
        owner = { cartId, ownerId: cartId }
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
]
