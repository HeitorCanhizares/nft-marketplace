import { http, HttpResponse } from 'msw'

import { availabilityBodySchema, loginBodySchema, registerBodySchema } from '../../schemas/auth'
import type { UserRecord } from '../db/db'
import { mergeGuestCart } from '../db/cartMerge'
import { getLockRemainingSeconds, registerFailedAttempt, resetAttempts } from '../db/loginAttempts'
import { hashPassword, verifyPassword } from '../db/password'
import { sessionsStore, usersStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { hasScenario } from '../scenarios/active'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import {
  authenticate,
  createSession,
  readBearerToken,
  readCartId,
  toPublicUser,
} from './sessionGuard'

function tooManyAttempts(retryAfterSeconds: number): Response {
  const unit = retryAfterSeconds === 1 ? 'segundo' : 'segundos'
  return apiError('TOO_MANY_ATTEMPTS', {
    details: { retryAfterSeconds },
    message: `Muitas tentativas. Tente novamente em ${retryAfterSeconds} ${unit}.`,
  })
}

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
  http.post(
    apiPath('/auth/login'),
    withMock('POST /auth/login', async ({ request }) => {
      const body: unknown = await request.json().catch(() => null)
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return apiError('BAD_REQUEST')
      }

      const parsed = loginBodySchema.safeParse(body)
      if (!parsed.success) return validationError(parsed.error)
      const data = parsed.data

      const locked = getLockRemainingSeconds(data.email)
      if (locked > 0) return tooManyAttempts(locked)

      const email = data.email.toLowerCase()
      const user = await usersStore.getByEmail(email)
      if (
        user === undefined ||
        !(await verifyPassword(data.password, {
          salt: user.passwordSalt,
          hash: user.passwordHash,
        }))
      ) {
        // Mesma resposta para e-mail inexistente e senha errada: o mock não revela quais contas existem.
        const retryAfterSeconds = registerFailedAttempt(email)
        if (retryAfterSeconds > 0) return tooManyAttempts(retryAfterSeconds)
        return apiError('INVALID_CREDENTIALS')
      }

      resetAttempts(email)
      const session = await createSession(user.id)
      const merge = await mergeGuestCart(user.id, readCartId(request))

      return HttpResponse.json({
        user: toPublicUser(user),
        session: { token: session.token, expiresAt: session.expiresAt },
        ...(merge.adjustments.length > 0 ? { details: { adjustments: merge.adjustments } } : {}),
      })
    }),
  ),
  http.get(
    apiPath('/auth/session'),
    withMock(
      'GET /auth/session',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        // A sessão não é estendida por esta rota.
        return HttpResponse.json({
          user: toPublicUser(auth.user),
          expiresAt: auth.session.expiresAt,
        })
      },
      { protected: true, exemptFromRandomFailures: true },
    ),
  ),
  http.post(
    apiPath('/auth/refresh'),
    withMock(
      'POST /auth/refresh',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        // Token novo com TTL cheio; o antigo deixa de valer.
        await sessionsStore.delete(auth.session.token)
        const session = await createSession(auth.user.id)

        return HttpResponse.json({
          session: { token: session.token, expiresAt: session.expiresAt },
        })
      },
      { protected: true },
    ),
  ),
  http.post(
    apiPath('/auth/logout'),
    withMock(
      'POST /auth/logout',
      async ({ request }) => {
        // Idempotente: token ausente, inválido ou já apagado também responde 204.
        const token = readBearerToken(request)
        if (token !== null && (await sessionsStore.get(token)) !== undefined) {
          await sessionsStore.delete(token)
        }

        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
]
