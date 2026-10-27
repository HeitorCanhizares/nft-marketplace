import type { Network, WalletProvider } from '@/types/nft'

export const NETWORK_OPTIONS: { value: Network; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

export const PROVIDER_OPTIONS: { value: WalletProvider; label: string }[] = [
  { value: 'metamask', label: 'MetaMask' },
  { value: 'walletconnect', label: 'WalletConnect' },
  { value: 'coinbase', label: 'Coinbase Wallet' },
]

// Ordem visual das carteiras no Pagamento (Figma): desktop e mobile.
export const CHECKOUT_PROVIDER_ORDER: readonly WalletProvider[] = [
  'walletconnect',
  'metamask',
  'coinbase',
]

export function networkLabel(network: Network): string {
  return NETWORK_OPTIONS.find((option) => option.value === network)?.label ?? network
}

export function providerLabel(provider: WalletProvider): string {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider
}
