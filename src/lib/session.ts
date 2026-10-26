import { STORAGE_KEYS, storage } from '@/lib/storage'
import { sessionSchema } from '@/schemas/user'
import type { Session } from '@/types/user'

// Aviso de expiração: 2 minutos antes de `expiresAt` (docs/fluxos/login.md, subitem 6).
export const EXPIRY_WARNING_MS = 120_000

// Lê a sessão do localStorage. JSON inválido ou formato inválido → null.
export function readSession(): Session | null {
  const raw = storage.local.getJson<unknown>(STORAGE_KEYS.session)
  const parsed = sessionSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export function writeSession(session: Session): void {
  storage.local.setJson(STORAGE_KEYS.session, session)
}

export function clearSession(): void {
  storage.local.remove(STORAGE_KEYS.session)
}

// Milissegundos até `expiresAt`. Nunca negativo; data inválida conta como expirada.
export function msUntilExpiry(expiresAt: string, now: number = Date.now()): number {
  const expiry = Date.parse(expiresAt)
  if (Number.isNaN(expiry)) return 0
  return Math.max(0, expiry - now)
}

// Milissegundos até o aviso (2 minutos antes de `expiresAt`). Nunca negativo.
export function msUntilWarning(expiresAt: string, now: number = Date.now()): number {
  return Math.max(0, msUntilExpiry(expiresAt, now) - EXPIRY_WARNING_MS)
}

export function isExpired(expiresAt: string, now: number = Date.now()): boolean {
  return msUntilExpiry(expiresAt, now) === 0
}

// Id do carrinho de visitante (chave `kurio:guest-cart-id`).
export function getGuestCartId(): string | null {
  return storage.local.get(STORAGE_KEYS.guestCartId)
}

export function ensureGuestCartId(): string {
  const existing = getGuestCartId()
  if (existing) return existing
  const id = crypto.randomUUID()
  storage.local.set(STORAGE_KEYS.guestCartId, id)
  return id
}

export function clearGuestCartId(): void {
  storage.local.remove(STORAGE_KEYS.guestCartId)
}
