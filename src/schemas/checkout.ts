import { z } from 'zod'
import type { WalletFormValues } from '@/schemas/wallet'
import { walletProviderSchema } from '@/schemas/common'
import { createOrderInputSchema } from '@/schemas/order'

export const checkoutNoteSchema = z.string().max(500, {
  error: 'A observação deve ter até 500 caracteres.',
})

// primary/secondary: dados da carteira salva; manual: "Preencher outra carteira".
export const checkoutModeSchema = z.enum(['primary', 'secondary', 'manual'])

export type CheckoutMode = z.output<typeof checkoutModeSchema>

// Mesmas chaves de WalletFormValues, todas string (a validação fica no envio).
const checkoutValuesSchema = z.object({
  displayName: z.string(),
  profileName: z.string(),
  network: z.string(),
  address: z.string(),
  secondaryAddressOrEns: z.string().optional(),
  provider: z.string(),
  referralCode: z.string(),
  email: z.string(),
  ensLabel: z.string(),
  nickname: z.string(),
  username: z.string(),
}) satisfies z.ZodType<WalletFormValues>

// Rascunho do Pagamento.
export const checkoutDraftSchema = z.object({
  userId: z.string(),
  mode: checkoutModeSchema,
  saveAsSecondary: z.boolean(),
  note: z.string(),
  provider: walletProviderSchema.nullable(),
  values: checkoutValuesSchema,
})

export type CheckoutDraft = z.output<typeof checkoutDraftSchema>

// Pedido em andamento: chave de idempotência, corpo enviado e, depois da resposta, o orderId.
export const checkoutPendingSchema = z.object({
  userId: z.string(),
  quoteId: z.string(),
  key: z.string(),
  request: createOrderInputSchema,
  orderId: z.string().optional(),
})

export type CheckoutPending = z.output<typeof checkoutPendingSchema>
