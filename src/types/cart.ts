import type { Edition, NftSummary } from './nft'

export type CartItem = {
  id: string
  nft: NftSummary
  edition: Pick<Edition, 'id' | 'label'>
  quantity: number
  unitPrice: string
  lineTotal: string
  availability: 'available' | 'low_stock' | 'sold_out' | 'insufficient'
  available: number | null
}

export type Cart = {
  id: string
  items: CartItem[]
  itemCount: number
  version: number
  coupon?: { code: string }
}

// Ajuste do carrinho mesclado no login/cadastro (applied 0 = item removido).
export type CartAdjustment = {
  nftId: string
  nftName: string
  editionId: string
  editionLabel: string
  requested: number
  applied: number
  reason: 'stock'
}

export type Quote = {
  id: string
  expiresAt: string
  cartVersion: number
  items: (CartItem & { priceChanged?: { from: string; to: string } })[]
  subtotal: string
  discount: string
  networkFee: string
  networkFeeEstimated: boolean
  total: string
  coupon?: { code: string; status: 'applied' | 'invalid' | 'expired'; message: string }
  warnings: ('PRICE_CHANGED' | 'SOLD_OUT' | 'LOW_STOCK')[]
}
