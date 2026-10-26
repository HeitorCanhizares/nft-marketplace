import { http, HttpResponse } from 'msw'

import { availabilityBodySchema, registerBodySchema } from '../../schemas/auth'
import { mergeGuestCart } from '../db/cartMerge'
import { hashPassword } from '../db/password'
import type { UserRecord } from '../db/db'
import { usersStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { hasScenario } from '../scenarios/active'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { createSession, readCartId, toPublicUser } from './sessionGuard'

export const authHandlers = [
  http.post(
    apiPath('/auth/availability'),
    withMock('POST /auth/availability', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = availabilityBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)

      // E-mail e usuário são únicos sem diferenciar maiúsculas.
      const users = await usersStore.getAll()
      const data = parsed.data
      const taken =
        'email' in data
          ? users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())
          : users.some((user) => user.username.toLowerCase() === data.username.toLowerCase())

      return HttpResponse.json({ available: !taken })
    }),
  ),
  http.post(
    apiPath('/auth/register'),
    withMock('POST /auth/register', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = registerBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)
      const data = parsed.data

      const emailMessage = 'Este e-mail já está cadastrado.'
      const usernameMessage = 'Este nome de usuário já está em uso.'

      if (hasScenario('email-taken')) {
        return apiError('EMAIL_TAKEN', { fields: { email: emailMessage } })
      }
      if (hasScenario('username-taken')) {
        return apiError('USERNAME_TAKEN', { fields: { username: usernameMessage } })
      }

      // E-mail e usuário são únicos sem diferenciar maiúsculas.
      const email = data.email.toLowerCase()
      const username = data.username.toLowerCase()
      const users = await usersStore.getAll()
      const emailTaken = users.some((user) => user.email.toLowerCase() === email)
      const usernameTaken = users.some((user) => user.username.toLowerCase() === username)

      if (emailTaken && usernameTaken) {
        return apiError('EMAIL_TAKEN', {
          fields: { email: emailMessage, username: usernameMessage },
        })
      }
      if (emailTaken) return apiError('EMAIL_TAKEN', { fields: { email: emailMessage } })
      if (usernameTaken) {
        return apiError('USERNAME_TAKEN', { fields: { username: usernameMessage } })
      }

      const passwordHash = await hashPassword(data.password)
      const user: UserRecord = {
        id: 'user-' + crypto.randomUUID(),
        username: data.username,
        email,
        displayName: data.username,
        passwordSalt: passwordHash.salt,
        passwordHash: passwordHash.hash,
      }
      await usersStore.put(user)

      const session = await createSession(user.id)
      const merge = await mergeGuestCart(user.id, readCartId(request))

      return HttpResponse.json(
        {
          user: toPublicUser(user),
          session: { token: session.token, expiresAt: session.expiresAt },
          ...(merge.adjustments.length > 0 ? { details: { adjustments: merge.adjustments } } : {}),
        },
        { status: 201 },
      )
    }),
  ),
]
