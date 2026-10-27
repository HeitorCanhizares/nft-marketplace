import { collectorSchema } from '@/schemas/order'
import { toEnsName } from '@/schemas/profile'
import { toWalletBody, type WalletBody, type WalletFormValues } from '@/schemas/wallet'
import type { CreateOrderInput } from '@/types/order'

// Recebe valores já validados por checkoutWalletFormSchema. Apelido vazio é aceito.
export function toCollector(values: WalletFormValues): CreateOrderInput['collector'] {
  const secondary = values.secondaryAddressOrEns?.trim() ?? ''

  return collectorSchema.parse({
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

// A API exige apelido na carteira secundária; sem apelido usa o padrão.
export function toSecondaryBody(values: WalletFormValues): WalletBody {
  return toWalletBody({
    ...values,
    nickname: values.nickname.trim() || 'Carteira secundária',
  })
}
