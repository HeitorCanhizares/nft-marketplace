import { http, HttpResponse } from 'msw'

import { toNftSummary } from '../db/nftSummary'
import { favoritesStore, nftsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { SEED_POSTS, SEED_PROMOS } from '../seed/content'
import { tryAuthenticate } from './sessionGuard'

// Valores a confirmar com o usuário. Na captura mobile, a imagem grande é o macaco de jaqueta verde
// e a pequena é o gorila de capuz roxo, ou seja, hero[0] e hero[1].
const HOME_HERO_IDS = ['emerald-ape-042', 'sage-nomad-009', 'golden-beat-207'] as const
const HOME_FEATURED_ID = 'cosmic-bloom-118'

export const homeHandlers = [
  http.get(
    apiPath('/home'),
    withMock('GET /home', async ({ request }) => {
      const auth = await tryAuthenticate(request)
      const favoriteIds =
        auth === null
          ? undefined
          : new Set(
              (await favoritesStore.listByUserId(auth.user.id)).map((favorite) => favorite.nftId),
            )

      const hero = []
      for (const id of HOME_HERO_IDS) {
        const record = await nftsStore.get(id)
        if (record === undefined) return apiError('INTERNAL_ERROR')
        hero.push(toNftSummary(record, favoriteIds))
      }

      const featuredRecord = await nftsStore.get(HOME_FEATURED_ID)
      if (featuredRecord === undefined) return apiError('INTERNAL_ERROR')

      // O cenário empty-catalog não afeta esta rota: hero e destaque continuam.
      return HttpResponse.json({
        hero,
        featured: toNftSummary(featuredRecord, favoriteIds),
        promos: [...SEED_PROMOS],
        posts: [...SEED_POSTS],
      })
    }),
  ),
]
