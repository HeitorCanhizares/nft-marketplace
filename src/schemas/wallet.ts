import { z } from 'zod'
import type { User, Wallet } from '@/types/user'
import {
  emailSchema,
  networkSchema,
  usernameSchema,
  walletAddressSchema,
  walletProviderSchema,
} from '@/schemas/common'
import {
  displayNameSchema,
  ENS_SUFFIX,
  ensLabelSchema,
  toEnsName,
  walletNicknameSchema,
} from '@/schemas/profile'

const SECONDARY_ADDRESS_OR_ENS_REGEX = /^(0x[0-9a-fA-F]{40}|[a-z0-9-]{3,63}\.eth)?$/
const ENS_NAME_BODY_REGEX = /^[a-z0-9-]{3,63}\.eth$/

const profileNameSchema = z
  .string({ error: 'Informe o nome do perfil.' })
  .trim()
  .min(1, { error: 'Informe o nome do perfil.', abort: true })
  .max(40, { error: 'O nome do perfil deve ter até 40 caracteres.' })

const referralCodeSchema = z
  .string({ error: 'Informe o código de indicação.' })
  .trim()
  .min(1, { error: 'Informe o código de indicação.', abort: true })
  .min(3, { error: 'O código de indicação deve ter entre 3 e 20 caracteres.' })
  .max(20, { error: 'O código de indicação deve ter entre 3 e 20 caracteres.' })
  .regex(/^[A-Za-z0-9_-]+$/, {
    error: 'Use apenas letras, números, "_" e "-", sem espaços.',
  })

const secondaryAddressOrEnsSchema = z
  .string({ error: 'Use um endereço 0x ou um nome .eth.' })
  .trim()
  .regex(SECONDARY_ADDRESS_OR_ENS_REGEX, { error: 'Use um endereço 0x ou um nome .eth.' })
  .optional()

// Rede e carteira começam como '' no formulário; o erro de "obrigatório" sai no envio.
function requiredOption<T>(schema: z.ZodType<T>, requiredMessage: string) {
  return z
    .string({ error: requiredMessage })
    .refine((value) => value !== '', { error: requiredMessage, abort: true })
    .transform((value, ctx): T => {
      const result = schema.safeParse(value)
      if (!result.success) {
        ctx.addIssue({
          code: 'custom',
          message: result.error.issues[0]?.message ?? requiredMessage,
        })
        return z.NEVER
      }
      return result.data
    })
}

const requiredNetworkSchema = requiredOption(networkSchema, 'Selecione uma rede.')

const requiredProviderSchema = requiredOption(walletProviderSchema, 'Selecione uma carteira.')

// Campos comuns ao Carteiras e ao Pagamento (fase 11), sem nickname e username.
const walletCoreShape = {
  displayName: displayNameSchema,
  profileName: profileNameSchema,
  network: requiredNetworkSchema,
  address: walletAddressSchema,
  secondaryAddressOrEns: secondaryAddressOrEnsSchema,
  provider: requiredProviderSchema,
  referralCode: referralCodeSchema,
  email: emailSchema,
  ensLabel: ensLabelSchema.refine((value) => value !== '', {
    error: 'Informe o nome ENS.',
    abort: true,
  }),
}

// Os dois formulários têm o MESMO tipo de valores (nickname e username, ambos string); só as regras mudam.
// Carteiras: apelido obrigatório; username vem da carteira/perfil e não aparece.
export const walletsFormSchema = z.object({
  ...walletCoreShape,
  nickname: walletNicknameSchema.min(1, { error: 'Informe o apelido da carteira.', abort: true }),
  username: z.string(),
})

export type WalletFormValues = z.input<typeof walletsFormSchema>

// Pagamento (fase 11): nome de usuário obrigatório; apelido aceita ''.
export const checkoutWalletFormSchema = z.object({
  ...walletCoreShape,
  nickname: z.string(),
  username: usernameSchema,
})

// Corpo do PUT de /wallets/*: campos de Wallet sem id e slot.
export const walletBodySchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  nickname: walletNicknameSchema.min(1, { error: 'Informe o apelido da carteira.', abort: true }),
  profileName: profileNameSchema,
  network: networkSchema,
  address: walletAddressSchema,
  secondaryAddressOrEns: secondaryAddressOrEnsSchema,
  provider: walletProviderSchema,
  referralCode: referralCodeSchema,
  email: emailSchema,
  ensName: z
    .string({ error: 'Use de 3 a 63 letras minúsculas, números ou hífens.' })
    .regex(ENS_NAME_BODY_REGEX, { error: 'Use de 3 a 63 letras minúsculas, números ou hífens.' }),
})

export type WalletBody = z.output<typeof walletBodySchema>

function stripEnsSuffix(ensName: string): string {
  return ensName.endsWith(ENS_SUFFIX) ? ensName.slice(0, -ENS_SUFFIX.length) : ensName
}

// Com carteira: copia os campos. Sem carteira: pré-preenche com o perfil (ou tudo vazio).
export function toWalletFormValues(wallet: Wallet | null, user: User | null): WalletFormValues {
  if (wallet) {
    return {
      displayName: wallet.displayName,
      profileName: wallet.profileName,
      network: wallet.network,
      address: wallet.address,
      secondaryAddressOrEns: wallet.secondaryAddressOrEns ?? '',
      provider: wallet.provider,
      referralCode: wallet.referralCode,
      email: wallet.email,
      ensLabel: stripEnsSuffix(wallet.ensName),
      nickname: wallet.nickname,
      username: wallet.username,
    }
  }

  return {
    displayName: user?.displayName ?? '',
    profileName: '',
    network: '',
    address: '',
    secondaryAddressOrEns: '',
    provider: '',
    referralCode: '',
    email: user?.email ?? '',
    ensLabel: stripEnsSuffix(user?.ensName ?? ''),
    nickname: user?.walletNickname ?? '',
    username: user?.username ?? '',
  }
}

// Recebe valores já validados pelo walletsFormSchema; o parse final garante o formato do corpo.
export function toWalletBody(values: WalletFormValues): WalletBody {
  const secondary = values.secondaryAddressOrEns?.trim() ?? ''

  return walletBodySchema.parse({
    displayName: values.displayName,
    username: values.username,
    nickname: values.nickname,
    profileName: values.profileName,
    network: values.network,
    address: values.address,
    ...(secondary === '' ? {} : { secondaryAddressOrEns: secondary }),
    provider: values.provider,
    referralCode: values.referralCode,
    email: values.email,
    ensName: toEnsName(values.ensLabel),
  })
}

// "Igual à carteira principal": mesmos valores da principal.
export function copyWalletValues(wallet: Wallet): WalletFormValues {
  return toWalletFormValues(wallet, null)
}
