import { http, HttpResponse } from 'msw'

import type { Review } from '@/types/nft'
import { nftsStore, reviewsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'

// Tamanho de página fixo do contrato: pageSize é ignorado.
const REVIEWS_PAGE_SIZE = 5

// Mais recentes primeiro; empate de data fica em ordem de id.
function compareReviews(a: Review, b: Review): number {
  const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt)
  if (byDate !== 0) return byDate
  if (a.id < b.id) return -1
  if (a.id > b.id) return 1
  return 0
}

// Ausente = 1; qualquer valor que não seja inteiro ≥ 1 é inválido.
function parsePage(raw: string | null): number | null {
  if (raw === null) return 1
  if (!/^\d+$/.test(raw)) return null
  const page = Number(raw)
  return page >= 1 ? page : null
}

export const reviewsHandlers = [
  http.get(
    apiPath('/nfts/:id/reviews'),
    withMock('GET /nfts/:id/reviews', async ({ request, params }) => {
      const id = params.id
      if (typeof id !== 'string') return apiError('BAD_REQUEST')

      const nft = await nftsStore.get(id)
      if (nft === undefined) return apiError('NOT_FOUND')

      const page = parsePage(new URL(request.url).searchParams.get('page'))
      if (page === null)
        return apiError('VALIDATION_ERROR', { fields: { page: 'Página inválida.' } })

      const all = (await reviewsStore.getByNftId(id)).sort(compareReviews)
      const total = all.length
      const start = (page - 1) * REVIEWS_PAGE_SIZE

      return HttpResponse.json({
        items: all.slice(start, start + REVIEWS_PAGE_SIZE),
        page,
        pageSize: REVIEWS_PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / REVIEWS_PAGE_SIZE),
      })
    }),
  ),
]
