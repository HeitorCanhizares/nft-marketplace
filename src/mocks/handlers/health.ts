import { http, HttpResponse } from 'msw'

import { nftsStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { withMock } from '../scenarios/middleware'

export const healthHandlers = [
  http.get(
    apiPath('/health'),
    withMock('GET /health', async () => {
      const nfts = await nftsStore.getAll()
      return HttpResponse.json({
        status: 'ok',
        seeded: nfts.length > 0,
        now: new Date().toISOString(),
      })
    }),
  ),
]
