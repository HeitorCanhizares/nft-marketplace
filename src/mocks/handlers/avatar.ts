import { http, HttpResponse } from 'msw'

import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '../../schemas/profile'
import { avatarsStore, usersStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate } from './sessionGuard'

const typeMessage = 'Use uma imagem PNG, JPG ou WEBP.'
const sizeMessage = 'A imagem deve ter até 2 MB.'

export const avatarHandlers = [
  http.put(
    apiPath('/profile/avatar'),
    withMock(
      'PUT /profile/avatar',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const form = await request.formData().catch(() => null)
        if (form === null) return apiError('BAD_REQUEST')

        const file = form.get('file')
        if (!(file instanceof File)) return apiError('BAD_REQUEST')

        // Arquivo inválido não substitui o avatar atual.
        if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
          return apiError('VALIDATION_ERROR', { fields: { file: typeMessage } })
        }
        if (file.size > AVATAR_MAX_BYTES) {
          return apiError('VALIDATION_ERROR', { fields: { file: sizeMessage } })
        }

        const { user } = auth
        await avatarsStore.put({ userId: user.id, blob: file })

        // O parâmetro v troca o cache do navegador a cada envio.
        const avatarUrl = apiPath('/avatars/' + user.id) + '?v=' + Date.now()
        await usersStore.put({ ...user, avatarUrl })

        return HttpResponse.json({ avatarUrl })
      },
      { protected: true },
    ),
  ),
  http.delete(
    apiPath('/profile/avatar'),
    withMock(
      'DELETE /profile/avatar',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const { user } = auth
        await avatarsStore.delete(user.id)

        // Idempotente: sem avatar, a remoção também responde 204.
        const next = { ...user }
        delete next.avatarUrl
        await usersStore.put(next)

        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
  // Pública: a <img> não envia Authorization.
  http.get(
    apiPath('/avatars/:userId'),
    withMock(
      'GET /avatars/:userId',
      async ({ params }) => {
        const avatar = await avatarsStore.get(String(params.userId))
        if (avatar === undefined) return apiError('NOT_FOUND')

        return new HttpResponse(avatar.blob, {
          headers: {
            'Content-Type': avatar.blob.type,
            'Cache-Control': 'no-store',
          },
        })
      },
      { exemptFromRandomFailures: true },
    ),
  ),
]
