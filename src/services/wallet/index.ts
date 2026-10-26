import type { WalletProviderApi } from '@/types/wallet'

// Sem implementação real de carteira: só o simulador registra um provedor.
let walletProvider: WalletProviderApi | null = null

export function registerWalletProvider(api: WalletProviderApi): void {
  walletProvider = api
}

export function getWalletProvider(): WalletProviderApi | null {
  return walletProvider
}

export function hasWalletProvider(): boolean {
  return walletProvider !== null
}
