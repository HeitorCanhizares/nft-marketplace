import type { User } from '../../types/user'
import type { SessionRecord, UserRecord } from '../db/db'
import { sessionsStore, usersStore } from '../db/stores'
import { mockConfig } from '../scenarios/config'
import { apiError } from '../scenarios/errors'

export type AuthenticatedRequest = {
  session: SessionRecord
  user: UserRecord
}

// Lê "Authorization: Bearer <token>"; ausente ou vazio vira null.
export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (header === null) return null

  const match = /^Bearer\s+(\S+)$/.exec(header.trim())
  return match?.[1] ?? null
}

// Lê X-Cart-Id; vazio ou ausente vira null.
export function readCartId(request: Request): string | null {
  const value = request.headers.get('X-Cart-Id')?.trim() ?? ''
  return value === '' ? null : value
}

export async function createSession(userId: string): Promise<SessionRecord> {
  const session: SessionRecord = {
    token: 'tok-' + crypto.randomUUID(),
    expiresAt: new Date(Date.now() + mockConfig.sessionTtlSeconds * 1000).toISOString(),
    userId,
  }
  await sessionsStore.put(session)
  return session
}

// Quem chama faz: if (auth instanceof Response) return auth.
export async function authenticate(request: Request): Promise<AuthenticatedRequest | Response> {
  const token = readBearerToken(request)
  if (token === null) return apiError('UNAUTHORIZED')

  const session = await sessionsStore.get(token)
  if (session === undefined) return apiError('UNAUTHORIZED')

  const user = await usersStore.get(session.userId)
  if (user === undefined) return apiError('UNAUTHORIZED')

  if (Date.parse(session.expiresAt) <= Date.now()) {
    await sessionsStore.delete(token)
    return apiError('SESSION_EXPIRED')
  }

  return { session, user }
}

// Nunca devolve passwordHash nem passwordSalt.
export function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    displayName: record.displayName,
    username: record.username,
    email: record.email,
    ...(record.ensName === undefined ? {} : { ensName: record.ensName }),
    ...(record.walletNickname === undefined ? {} : { walletNickname: record.walletNickname }),
    ...(record.avatarUrl === undefined ? {} : { avatarUrl: record.avatarUrl }),
  }
}
