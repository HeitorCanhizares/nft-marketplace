import type { ZodType } from 'zod'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import {
  checkoutDraftSchema,
  checkoutPendingSchema,
  type CheckoutDraft,
  type CheckoutPending,
} from '@/schemas/checkout'

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

// Lê um registro e valida o formato. Valor inválido é apagado e devolve null.
function readValid<T>(key: string, schema: ZodType<T>): T | null {
  const raw = storage.session.get(key)
  if (raw === null) return null

  const result = schema.safeParse(parseJson(raw))
  if (!result.success) {
    storage.session.remove(key)
    return null
  }
  return result.data
}

export function readDraft(userId: string): CheckoutDraft | null {
  const draft = readValid(STORAGE_KEYS.checkoutDraft, checkoutDraftSchema)
  if (draft === null) return null

  if (draft.userId !== userId) {
    clearDraft()
    return null
  }
  return draft
}

export function writeDraft(draft: CheckoutDraft): void {
  storage.session.setJson(STORAGE_KEYS.checkoutDraft, draft)
}

export function clearDraft(): void {
  storage.session.remove(STORAGE_KEYS.checkoutDraft)
}

export function readPending(userId: string): CheckoutPending | null {
  const pending = readValid(STORAGE_KEYS.checkout, checkoutPendingSchema)
  if (pending === null) return null

  if (pending.userId !== userId) {
    clearPending()
    return null
  }
  return pending
}

export function writePending(pending: CheckoutPending): void {
  storage.session.setJson(STORAGE_KEYS.checkout, pending)
}

// Atualiza só o orderId do registro existente. Sem registro válido, não faz nada.
export function setPendingOrderId(orderId: string): void {
  const pending = readValid(STORAGE_KEYS.checkout, checkoutPendingSchema)
  if (pending === null) return

  writePending({ ...pending, orderId })
}

export function clearPending(): void {
  storage.session.remove(STORAGE_KEYS.checkout)
}
