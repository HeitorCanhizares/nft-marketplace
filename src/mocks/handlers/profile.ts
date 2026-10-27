import { http, HttpResponse } from 'msw'

import { changePasswordBodySchema, profileBodySchema } from '../../schemas/profile'
import type { UserRecord } from '../db/db'
import { hashPassword, verifyPassword } from '../db/password'
import { sessionsStore, usersStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { authenticate, toPublicUser } from './sessionGuard'

const emailMessage = 'Este e-mail já está cadastrado.'
const usernameMessage = 'Este nome de usuário já está em uso.'
const currentPasswordMessage = 'Senha atual incorreta.'

export const profileHandlers = [
  http.get(
    apiPath('/profile'),
    withMock(
      'GET /profile',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        return HttpResponse.json(toPublicUser(auth.user))
      },
      { protected: true },
    ),
  ),
  http.patch(
    apiPath('/profile'),
    withMock(
      'PATCH /profile',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const body: unknown = await request.json().catch(() => null)
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
          return apiError('BAD_REQUEST')
        }

        const parsed = profileBodySchema.safeParse(body)
        if (!parsed.success) return validationError(parsed.error)
        const data = parsed.data
        const { user } = auth

        // Trocar o e-mail exige a senha atual; alterar só os dados não exige.
        const email = data.email.toLowerCase()
        if (email !== user.email.toLowerCase()) {
          if (data.currentPassword === undefined) {
            return apiError('VALIDATION_ERROR', {
              fields: { currentPassword: 'Informe sua senha atual.' },
            })
          }
          const passwordOk = await verifyPassword(data.currentPassword, {
            salt: user.passwordSalt,
            hash: user.passwordHash,
          })
          if (!passwordOk) {
            return apiError('INVALID_CURRENT_PASSWORD', {
              fields: { currentPassword: currentPasswordMessage },
            })
          }
        }

        // E-mail e usuário são únicos sem diferenciar maiúsculas, ignorando o próprio usuário.
        const username = data.username.toLowerCase()
        const others = (await usersStore.getAll()).filter((other) => other.id !== user.id)
        const emailTaken = others.some((other) => other.email.toLowerCase() === email)
        const usernameTaken = others.some((other) => other.username.toLowerCase() === username)

        if (emailTaken && usernameTaken) {
          return apiError('EMAIL_TAKEN', {
            fields: { email: emailMessage, username: usernameMessage },
          })
        }
        if (emailTaken) return apiError('EMAIL_TAKEN', { fields: { email: emailMessage } })
        if (usernameTaken) {
          return apiError('USERNAME_TAKEN', { fields: { username: usernameMessage } })
        }

        // Vazio ou ausente limpa ensName e walletNickname: a chave não é guardada.
        const next: UserRecord = {
          id: user.id,
          displayName: data.displayName,
          username: data.username,
          email,
          passwordSalt: user.passwordSalt,
          passwordHash: user.passwordHash,
          ...(data.ensName ? { ensName: data.ensName } : {}),
          ...(data.walletNickname ? { walletNickname: data.walletNickname } : {}),
          ...(user.avatarUrl === undefined ? {} : { avatarUrl: user.avatarUrl }),
        }
        await usersStore.put(next)

        return HttpResponse.json(toPublicUser(next))
      },
      { protected: true },
    ),
  ),
  http.post(
    apiPath('/profile/password'),
    withMock(
      'POST /profile/password',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        const body: unknown = await request.json().catch(() => null)
        if (typeof body !== 'object' || body === null || Array.isArray(body)) {
          return apiError('BAD_REQUEST')
        }

        const parsed = changePasswordBodySchema.safeParse(body)
        if (!parsed.success) return validationError(parsed.error)
        const data = parsed.data
        const { user } = auth

        const passwordOk = await verifyPassword(data.currentPassword, {
          salt: user.passwordSalt,
          hash: user.passwordHash,
        })
        if (!passwordOk) {
          return apiError('INVALID_CURRENT_PASSWORD', {
            fields: { currentPassword: currentPasswordMessage },
          })
        }

        const passwordHash = await hashPassword(data.newPassword)
        await usersStore.put({
          ...user,
          passwordSalt: passwordHash.salt,
          passwordHash: passwordHash.hash,
        })

        // A sessão atual continua valendo; as outras sessões do mesmo usuário são encerradas.
        const sessions = await sessionsStore.getAll()
        for (const session of sessions) {
          if (session.userId === user.id && session.token !== auth.session.token) {
            await sessionsStore.delete(session.token)
          }
        }

        return new HttpResponse(null, { status: 204 })
      },
      { protected: true },
    ),
  ),
]
