import type { CartSummaryPanelProps } from '@/components/shared/CartSummaryPanel'
import type { PriceChange } from '@/components/shared/LineItem'
import type { CartItem } from '@/types/cart'

// Ações das linhas: a página liga cada uma aos hooks de carrinho.
export type CartLineActions = {
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  onAdjust: (item: CartItem) => void
}

export type CartSummaryProps = Omit<CartSummaryPanelProps, 'variant'>

// Tudo que as telas do carrinho (desktop e mobile) recebem da página.
export type CartViewProps = {
  items: CartItem[]
  priceChanges: ReadonlyMap<string, PriceChange>
  busyIds: ReadonlySet<string>
  actions: CartLineActions
  summary: CartSummaryProps
}
