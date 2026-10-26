import { LineItem, type LineItemVariant, type PriceChange } from '@/components/shared/LineItem'
import { LineItemSkeleton } from '@/components/shared/LineItemSkeleton'
import type { CartItem } from '@/types/cart'

const SKELETON_ROWS = 3

type LineItemListProps = {
  variant: LineItemVariant
  items: readonly CartItem[]
  priceChanges: ReadonlyMap<string, PriceChange>
  busyIds: ReadonlySet<string>
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  onAdjust: (item: CartItem) => void
  isLoading?: boolean
}

// Desktop: tabela com cabeçalho. Mobile: lista de cards.
export function LineItemList({
  variant,
  items,
  priceChanges,
  busyIds,
  onQuantityChange,
  onRemove,
  onAdjust,
  isLoading = false,
}: LineItemListProps) {
  const rows = isLoading
    ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <LineItemSkeleton key={`skeleton-${index}`} variant={variant} />
      ))
    : items.map((item) => (
        <LineItem
          key={item.id}
          variant={variant}
          item={item}
          priceChange={priceChanges.get(item.id)}
          busy={busyIds.has(item.id)}
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
          onAdjust={onAdjust}
        />
      ))

  if (variant === 'cart-card') {
    return <ul className="flex flex-col gap-3">{rows}</ul>
  }

  return (
    <table className="w-full border-separate border-spacing-y-3 text-left text-body">
      <caption className="sr-only">Itens do carrinho</caption>
      <thead>
        <tr className="text-body text-foreground">
          <th scope="col" className="border-b border-border pb-2 font-normal">
            NFTs
          </th>
          <th scope="col" className="border-b border-border pb-2 font-normal">
            Preço
          </th>
          <th scope="col" className="border-b border-border pb-2 font-normal">
            Edições
          </th>
          <th scope="col" className="border-b border-border pb-2 font-normal">
            Total
          </th>
          <th scope="col" className="border-b border-border pb-2 font-normal">
            <span className="sr-only">Remover</span>
          </th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}
