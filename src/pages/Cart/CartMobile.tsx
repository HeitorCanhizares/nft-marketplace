import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { CartSummaryPanel } from '@/components/shared/CartSummaryPanel'
import { LineItemList } from '@/components/shared/LineItemList'
import type { CartViewProps } from '@/pages/Cart/viewProps'

// Tela mobile: lista de cards e o resumo fixo no rodapé. Sem recomendações.
export function CartMobile({ items, priceChanges, busyIds, actions, summary }: CartViewProps) {
  return (
    <div className="flex flex-col pb-4">
      <MobileTopBar title="Carrinho de NFTs" />

      <div className="px-4 pb-6">
        <LineItemList
          variant="cart-card"
          items={items}
          priceChanges={priceChanges}
          busyIds={busyIds}
          onQuantityChange={actions.onQuantityChange}
          onRemove={actions.onRemove}
          onAdjust={actions.onAdjust}
        />
      </div>

      <CartSummaryPanel variant="mobile" {...summary} />
    </div>
  )
}
