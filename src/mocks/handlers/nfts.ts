import { http, HttpResponse } from 'msw'

import { applyFilters, buildCatalogContext } from '../db/catalogFilter'
import { buildFacets } from '../db/catalogFacets'
import { parseCatalogQuery } from '../db/catalogParams'
import { sortNfts } from '../db/catalogSort'
import type { NftRecord } from '../db/db'
import { toNftSummary } from '../db/nftSummary'
import { favoritesStore, nftsStore, usersStore } from '../db/stores'
import { hasScenario } from '../scenarios/active'
import { apiPath } from '../scenarios/config'
import { apiError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate, tryAuthenticate } from './sessionGuard'

// Número de favoritos de cada NFT: o total do seed mais os favoritos reais de todos os usuários.
async function countFavorites(all: NftRecord[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  for (const nft of all) counts.set(nft.id, nft.stats.favoritesTotal)

  for (const user of await usersStore.getAll()) {
    for (const favorite of await favoritesStore.listByUserId(user.id)) {
      counts.set(favorite.nftId, (counts.get(favorite.nftId) ?? 0) + 1)
    }
  }
  return counts
}

export const nftsHandlers = [
  http.get(
    apiPath('/nfts'),
    withMock('GET /nfts', async ({ request }) => {
      const parsed = parseCatalogQuery(new URL(request.url).searchParams)
      if (!parsed.ok) return apiError('VALIDATION_ERROR', { fields: parsed.fields })
      const query = parsed.query

      // Com favorites=1 o token é obrigatório; sem ele, a visita pública trata a falha como visitante.
      let favoriteIds: Set<string> | null = null
      if (query.favorites) {
        if (hasScenario('session-expired')) return apiError('SESSION_EXPIRED')
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth
        const favorites = await favoritesStore.listByUserId(auth.user.id)
        favoriteIds = new Set(favorites.map((favorite) => favorite.nftId))
      } else {
        const auth = await tryAuthenticate(request)
        if (auth !== null) {
          const favorites = await favoritesStore.listByUserId(auth.user.id)
          favoriteIds = new Set(favorites.map((favorite) => favorite.nftId))
        }
      }

      const all = hasScenario('empty-catalog') ? [] : await nftsStore.getAll()
      const context = buildCatalogContext(all, favoriteIds)
      const filtered = applyFilters(all, query, context)
      const favoriteCounts = await countFavorites(all)
      const sorted = sortNfts(filtered, query.sort, favoriteCounts)

      const total = sorted.length
      const totalPages = Math.ceil(total / query.pageSize)
      const start = (query.page - 1) * query.pageSize
      const items = sorted.slice(start, start + query.pageSize)

      return HttpResponse.json({
        items: items.map((record) => toNftSummary(record, favoriteIds ?? undefined)),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        facets: buildFacets(all, query, context),
      })
    }),
  ),
]
