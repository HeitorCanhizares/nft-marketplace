import { z } from 'zod'
import type { Network, Paginated, WalletProvider } from '@/types/nft'

export const networkSchema: z.ZodType<Network> = z.enum(['ethereum', 'polygon', 'solana'], {
  error: 'Rede inválida.',
})

export const walletProviderSchema: z.ZodType<WalletProvider> = z.enum(
  ['metamask', 'walletconnect', 'coinbase'],
  { error: 'Tipo de carteira inválido.' },
)

// String decimal sem sinal e sem notação científica (ex.: "1.19"). Nunca number.
export const ethAmountSchema = z
  .string({ error: 'Valor em ETH inválido.' })
  .regex(/^\d+(\.\d+)?$/, { error: 'Valor em ETH inválido.' })

export const isoDateSchema = z.iso.datetime({
  offset: true,
  error: 'Data inválida.',
})

export const emailSchema = z
  .string({ error: 'Informe um e-mail.' })
  .trim()
  .pipe(z.email({ error: 'Informe um e-mail válido.' }))

export const usernameSchema = z
  .string({ error: 'Informe um nome de usuário.' })
  .min(3, { error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' })
  .max(20, { error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' })
  .regex(/^[A-Za-z0-9_.]+$/, {
    error: 'Use apenas letras, números, "_" e ".", sem espaços.',
  })

export const passwordSchema = z
  .string({ error: 'Informe uma senha.' })
  .min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' })
  .regex(/\p{L}/u, { error: 'A senha deve ter pelo menos uma letra e um número.' })
  .regex(/\d/, { error: 'A senha deve ter pelo menos uma letra e um número.' })

export const walletAddressSchema = z
  .string({ error: 'Informe um endereço de carteira.' })
  .regex(/^0x[0-9a-fA-F]{40}$/, { error: 'Endereço de carteira inválido.' })

export const positiveIntSchema = z
  .number({ error: 'Informe um número inteiro.' })
  .int({ error: 'Informe um número inteiro.' })
  .min(1, { error: 'O valor deve ser pelo menos 1.' })

export function paginatedSchema<T extends z.ZodType>(item: T): z.ZodType<Paginated<z.output<T>>> {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
}
