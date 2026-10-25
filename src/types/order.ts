import type { Network, WalletProvider } from './nft'
import type { Wallet } from './user'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

// Snapshot imutável: copiado da cotação na criação do pedido.
export type OrderItemSnapshot = {
  nftId: string
  name: string
  tokenId: string
  image: { src: string; alt: string }
  editionId: string
  editionLabel: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export type Order = {
  id: string
  status: OrderStatus
  createdAt: string
  quoteId: string
  txHash?: string
  declineReason?: string
  network: Network
  wallet: { label: string; provider: WalletProvider; address: string }
  collector: Omit<Wallet, 'id' | 'slot'> & { note?: string }
  items: OrderItemSnapshot[]
  subtotal: string
  discount: string
  coupon?: { code: string }
  networkFee: string
  total: string
  explorerUrl?: string
}

export type QuoteChange = 'PRICE_CHANGED' | 'SOLD_OUT' | 'COUPON_EXPIRED' | 'FEE_CHANGED'

export type CreateOrderInput = {
  quoteId: string
  collector: Omit<Wallet, 'id' | 'slot'>
  walletId?: string
  network: Network
  provider: WalletProvider
  walletAddress: string
  note?: string
}
