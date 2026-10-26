// Estado só em memória: recarregar a página zera o bloqueio (decisão registrada).
export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_SECONDS = 30

type AttemptState = {
  count: number
  // 0 quando não há bloqueio.
  lockedUntil: number
}

const attempts = new Map<string, AttemptState>()

// Conta qualquer e-mail, existente ou não, para o mock não revelar quais contas existem.
function normalizeEmail(email: string): string {
  return email.replace(/\s+/g, '').toLowerCase()
}

function remainingSeconds(lockedUntil: number, now: number): number {
  return Math.ceil((lockedUntil - now) / 1000)
}

export function getLockRemainingSeconds(email: string, now = Date.now()): number {
  const key = normalizeEmail(email)
  const state = attempts.get(key)
  if (state === undefined || state.lockedUntil === 0) return 0

  // Bloqueio vencido: apaga a entrada, o contador volta a zero.
  if (state.lockedUntil <= now) {
    attempts.delete(key)
    return 0
  }
  return remainingSeconds(state.lockedUntil, now)
}

export function registerFailedAttempt(email: string, now = Date.now()): number {
  const key = normalizeEmail(email)
  const previous = attempts.get(key)
  const expired =
    previous !== undefined && previous.lockedUntil !== 0 && previous.lockedUntil <= now
  const state: AttemptState =
    expired || previous === undefined ? { count: 0, lockedUntil: 0 } : previous

  state.count += 1
  if (state.count >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = now + LOCK_SECONDS * 1000
  }
  attempts.set(key, state)

  return state.lockedUntil === 0 ? 0 : remainingSeconds(state.lockedUntil, now)
}

export function resetAttempts(email: string): void {
  attempts.delete(normalizeEmail(email))
}
