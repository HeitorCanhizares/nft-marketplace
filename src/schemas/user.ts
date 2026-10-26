import { z } from 'zod'
import type { Session, User, Wallet, WalletsResponse } from '@/types/user'
import {
  emailSchema,
  isoDateSchema,
  networkSchema,
  walletAddressSchema,
  walletProviderSchema,
} from '@/schemas/common'

export const userSchema: z.ZodType<User> = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: emailSchema,
  ensName: z.string().optional(),
  walletNickname: z.string().optional(),
  avatarUrl: z.string().optional(),
})

export const sessionSchema: z.ZodType<Session> = z.object({
  token: z.string(),
  expiresAt: isoDateSchema,
})

// Carteira completa (resposta de GET /wallets e PUT /wallets/*).
// Concreto (não ZodType) para permitir .omit() em src/schemas/order.ts (collector).
export const walletSchema = z.object({
  id: z.string(),
  slot: z.enum(['primary', 'secondary']),
  displayName: z.string(),
  username: z.string(),
  nickname: z.string(),
  profileName: z.string(),
  network: networkSchema,
  address: walletAddressSchema,
  secondaryAddressOrEns: z.string().optional(),
  provider: walletProviderSchema,
  referralCode: z.string(),
  email: emailSchema,
  ensName: z.string(),
}) satisfies z.ZodType<Wallet>

export const walletsResponseSchema: z.ZodType<WalletsResponse> = z.object({
  primary: walletSchema.nullable(),
  secondary: walletSchema.nullable(),
})

// Ajustes do carrinho mesclado no login (decisão A1). Formato da lista: textos prontos para exibir.
export const loginResponseSchema: z.ZodType<{
  user: User
  session: Session
  details?: { adjustments?: string[] }
}> = z.object({
  user: userSchema,
  session: sessionSchema,
  details: z
    .object({
      adjustments: z.array(z.string()).optional(),
    })
    .optional(),
})

export const sessionResponseSchema: z.ZodType<{ user: User; expiresAt: string }> = z.object({
  user: userSchema,
  expiresAt: isoDateSchema,
})

export const availabilityResponseSchema: z.ZodType<{ available: boolean }> = z.object({
  available: z.boolean(),
})
