import { Breadcrumb, type BreadcrumbEntry } from '@/components/layout/Breadcrumb'
import { CartSummaryPanel } from '@/components/shared/CartSummaryPanel'
import { LineItemList } from '@/components/shared/LineItemList'
import { NftCarousel } from '@/components/shared/NftCarousel'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useRecommendedNfts } from '@/hooks/useRecommendedNfts'
import { useToggleFavorite } from '@/hooks/useToggleFavorite'
import type { CartViewProps } from '@/pages/Cart/viewProps'

const BREADCRUMB: BreadcrumbEntry[] = [
  { label: 'Início', link: { to: '/' } },
  { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
  { label: 'Carrinho' },
]

// Tela desktop: tabela das linhas e resumo ao lado; recomendações embaixo.
export function CartDesktop({ items, priceChanges, busyIds, actions, summary }: CartViewProps) {
  const { add, pendingIds: cartPending } = useAddToCart()
  const { toggle, pendingIds: favoritePending } = useToggleFavorite()
  const recommended = useRecommendedNfts(items.map((item) => item.nft.id))

  return (
    <div className="container-page flex flex-col pb-16">
      <Breadcrumb items={BREADCRUMB} className="mb-2.5" />
      <h1 className="sr-only max-lg:hidden">Carrinho de NFTs</h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-22">
        <LineItemList
          variant="cart-row"
          items={items}
          priceChanges={priceChanges}
          busyIds={busyIds}
          onQuantityChange={actions.onQuantityChange}
          onRemove={actions.onRemove}
          onAdjust={actions.onAdjust}
        />
        <div className="lg:sticky lg:top-8 lg:self-start">
          <CartSummaryPanel variant="desktop" {...summary} />
        </div>
      </div>

      <div className="mt-24">
        <NftCarousel
          title="Colecionadores também viram"
          items={recommended.data}
          isLoading={recommended.isPending}
          isError={recommended.isError}
          onRetry={() => {
            void recommended.refetch()
          }}
          onAddToCart={add}
          onToggleFavorite={toggle}
          favoriteBusyIds={favoritePending}
          cartBusyIds={cartPending}
        />
      </div>
    </div>
  )
}
