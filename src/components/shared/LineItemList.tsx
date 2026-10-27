import { LineItem, type CartLineItemVariant, type PriceChange } from '@/components/shared/LineItem'
import { LineItemSkeleton } from '@/components/shared/LineItemSkeleton'
import type { CartItem } from '@/types/cart'
import type { OrderItemSnapshot } from '@/types/order'

const SKELETON_ROWS = 3

type CartLineItemListProps = {
  variant: CartLineItemVariant
  items: readonly CartItem[]
  priceChanges: ReadonlyMap<string, PriceChange>
  busyIds: ReadonlySet<string>
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  onAdjust: (item: CartItem) => void
  isLoading?: boolean
}

// Revisão e Pagamento: só leitura, sem handlers.
type SummaryLineItemListProps = {
  variant: 'summary'
  items: readonly CartItem[]
  isLoading?: boolean
}

// Recibo do pedido: só leitura, a partir dos snapshots.
type ReceiptLineItemListProps = {
  variant: 'receipt'
  items: readonly OrderItemSnapshot[]
  isLoading?: boolean
}

type LineItemListProps = CartLineItemListProps | SummaryLineItemListProps | ReceiptLineItemListProps

// Desktop: tabela com cabeçalho. Mobile: lista de cards. Summary: lista "NFTs | Subtotal".
export function LineItemList(props: LineItemListProps) {
  if (props.variant === 'summary') {
    return <SummaryLineItemList items={props.items} isLoading={props.isLoading ?? false} />
  }

  if (props.variant === 'receipt') {
    return <ReceiptLineItemList items={props.items} isLoading={props.isLoading ?? false} />
  }

  const {
    variant,
    items,
    priceChanges,
    busyIds,
    onQuantityChange,
    onRemove,
    onAdjust,
    isLoading = false,
  } = props

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

type ReceiptLineItemListBodyProps = {
  items: readonly OrderItemSnapshot[]
  isLoading: boolean
}

// Cabeçalho visual "NFTs | Edições | Subtotal" (aria-hidden). No mobile "Edições" some.
function ReceiptLineItemList({ items, isLoading }: ReceiptLineItemListBodyProps) {
  const rows = isLoading
    ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <LineItemSkeleton key={`skeleton-${index}`} variant="receipt" />
      ))
    : items.map((item) => (
        <LineItem key={`${item.nftId}-${item.editionId}`} variant="receipt" item={item} />
      ))

  return (
    <div>
      <div
        aria-hidden="true"
        className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border-soft pb-2 text-body text-foreground max-lg:pr-3 lg:grid-cols-[minmax(0,1fr)_90px_7rem]"
      >
        <span>NFTs</span>
        <span className="text-center max-lg:hidden">Edições</span>
        <span className="text-right">Subtotal</span>
      </div>
      <ul aria-label="Itens do pedido" className="mt-3 flex flex-col gap-3">
        {rows}
      </ul>
    </div>
  )
}

type SummaryLineItemListBodyProps = {
  items: readonly CartItem[]
  isLoading: boolean
}

function SummaryLineItemList({ items, isLoading }: SummaryLineItemListBodyProps) {
  const rows = isLoading
    ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <LineItemSkeleton key={`skeleton-${index}`} variant="summary" />
      ))
    : items.map((item) => <LineItem key={item.id} variant="summary" item={item} />)

  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="mb-2 flex justify-between text-body text-foreground">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul aria-label="Seus NFTs" className="flex flex-col gap-3">
        {rows}
      </ul>
    </div>
  )
}
