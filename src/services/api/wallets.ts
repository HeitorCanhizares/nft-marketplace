import { walletSchema, walletsResponseSchema } from '@/schemas/user'
import type { WalletBody } from '@/schemas/wallet'
import { del, get, post, put } from '@/services/http/validate'

export function getWallets(signal?: AbortSignal) {
  return get('/wallets', walletsResponseSchema, { signal })
}

export function savePrimaryWallet(body: WalletBody) {
  return put('/wallets/primary', walletSchema, body)
}

export function saveSecondaryWallet(body: WalletBody) {
  return put('/wallets/secondary', walletSchema, body)
}

export function removeSecondaryWallet() {
  return del('/wallets/secondary', null)
}

export function swapWallets() {
  return post('/wallets/swap', walletsResponseSchema, undefined)
}
