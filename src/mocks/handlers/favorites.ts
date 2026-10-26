import { http, HttpResponse } from 'msw'

import { favoritesStore, nftsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate } from './sessionGuard'

export const favoritesHandlers = [
  http.get(
    apiPath('/favorites'),
    withMock(
      'GET /favorites',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const favorites = await favoritesStore.listByUserId(auth.user.id)
        return HttpResponse.json({ ids: favorites.map((favorite) => favorite.nftId) })
      },
      { protected: true },
    ),
  ),
  http.put(
    apiPath('/favorites/:nftId'),
    withMock(
      'PUT /favorites/:nftId',
      async ({ request, params }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const nftId = params.nftId
        if (typeof nftId !== 'string') return apiError('BAD_REQUEST')

        const nft = await nftsStore.get(nftId)
        if (nft === undefined) return apiError('NOT_FOUND')

        // Idempotente: favoritar de novo não cria outro registro.
        await favoritesStore.add({ userId: auth.user.id, nftId })
        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
  http.delete(
    apiPath('/favorites/:nftId'),
    withMock(
      'DELETE /favorites/:nftId',
      async ({ request, params }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const nftId = params.nftId
        if (typeof nftId !== 'string') return apiError('BAD_REQUEST')

        // Idempotente: remover quem não está favoritado também responde 204.
        await favoritesStore.remove(auth.user.id, nftId)
        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
]
