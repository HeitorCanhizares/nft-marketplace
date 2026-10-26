import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { networkSchema, walletProviderSchema } from '@/schemas/common'
import { buildQuote } from '../db/quote'
import type { CartRecord } from '../db/db'
import { cartsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { hasScenario } from '../scenarios/active'
import { withMock } from '../scenarios/middleware'
import { resolveOwner } from './cart'

const quoteBodySchema = z.object({
  network: networkSchema.optional(),
  provider: walletProviderSchema.optional(),
})

export const quoteHandlers = [
  http.post(
    apiPath('/quote'),
    withMock('POST /quote', async ({ request }) => {
      // Corpo opcional: vazio vale {}.
      let body: unknown = {}
      const text = await request.text()
      if (text.trim() !== '') {
        try {
          body = JSON.parse(text)
        } catch {
          return apiError('BAD_REQUEST')
        }
      }

      const parsed = quoteBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      const owner = await resolveOwner(request)
      if (owner instanceof Response) return owner

      const empty: CartRecord = {
        id: owner?.cartId ?? 'guest-empty',
        ownerId: owner?.ownerId ?? 'guest-empty',
        items: [],
        itemCount: 0,
        version: 0,
      }
      const record =
        owner === null || hasScenario('empty-cart') ? undefined : await cartsStore.get(owner.cartId)

      return HttpResponse.json(await buildQuote(record ?? empty, parsed.data))
    }),
  ),
]
