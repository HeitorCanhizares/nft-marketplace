import { z } from 'zod'

import { isoDateSchema } from '@/schemas/common'
import { STORAGE_KEYS, storage } from '@/lib/storage'

const PENDING_TTL_MS = 10 * 60 * 1000
const FAILURE_MESSAGE = 'Não foi possível concluir a ação que você pediu. Tente de novo.'

const pendingActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('favorite'), nftId: z.string().min(1) }),
  z.object({
    type: z.literal('add-to-cart'),
    nftId: z.string().min(1),
    editionId: z.string().min(1),
    quantity: z.number().int().min(1),
  }),
])

const storedPendingSchema = z.object({
  action: pendingActionSchema,
  createdAt: isoDateSchema,
})

export type PendingAction = z.output<typeof pendingActionSchema>
export type PendingType = PendingAction['type']

export type PendingResult = { ok: true; message: string } | { ok: false; message: string }

type Executor<T extends PendingType> = (
  action: Extract<PendingAction, { type: T }>,
) => Promise<string>

// Executores registrados por tipo (fases 06 e 07). Tipo sem executor não executa nada.
const executors = new Map<PendingType, (action: PendingAction) => Promise<string>>()

export function savePendingAction(action: PendingAction): void {
  storage.session.setJson(STORAGE_KEYS.pendingAction, {
    action,
    createdAt: new Date().toISOString(),
  })
}

export function clearPendingAction(): void {
  storage.session.remove(STORAGE_KEYS.pendingAction)
}

export function readPendingAction(): PendingAction | null {
  const stored = storage.session.getJson<unknown>(STORAGE_KEYS.pendingAction)
  const parsed = storedPendingSchema.safeParse(stored)
  if (!parsed.success) return null

  const age = Date.now() - Date.parse(parsed.data.createdAt)
  if (age > PENDING_TTL_MS) {
    clearPendingAction()
    return null
  }

  return parsed.data.action
}

export function registerPendingExecutor<T extends PendingType>(
  type: T,
  executor: Executor<T>,
): () => void {
  // Um executor só recebe ações do próprio tipo (a chave do Map garante isso).
  const wrapped = executor as (action: PendingAction) => Promise<string>
  executors.set(type, wrapped)

  return () => {
    if (executors.get(type) === wrapped) executors.delete(type)
  }
}

export async function runPendingAction(): Promise<PendingResult | null> {
  const action = readPendingAction()
  if (!action) return null

  const executor = executors.get(action.type)
  if (!executor) return null

  // Apaga antes de executar: a ação nunca roda duas vezes.
  clearPendingAction()

  try {
    const message = await executor(action)
    return { ok: true, message }
  } catch {
    return { ok: false, message: FAILURE_MESSAGE }
  }
}
