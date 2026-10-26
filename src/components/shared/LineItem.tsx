import { Link } from '@tanstack/react-router'
import { RefreshCwIcon, Trash2Icon } from 'lucide-react'

import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/formatEth'
import { MAX_PER_PURCHASE } from '@/lib/maxQuantity'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types/cart'

export type PriceChange = { from: string; to: string }

export type LineItemVariant = 'cart-row' | 'cart-card'

type LineItemProps = {
  variant: LineItemVariant
  item: CartItem
  priceChange?: PriceChange
  busy?: boolean
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  onAdjust: (item: CartItem) => void
}

type PartProps = {
  item: CartItem
  className?: string
}

function LineThumb({ item, className }: PartProps) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: item.nft.id }}
      aria-hidden="true"
      tabIndex={-1}
      className={cn('block shrink-0', className)}
    >
      <img src={item.nft.image.src} alt="" loading="lazy" className="size-full object-cover" />
    </Link>
  )
}

function LineName({ item }: PartProps) {
  return (
    <p className="font-bold text-foreground">
      <Link to="/nft/$nftId" params={{ nftId: item.nft.id }} className="hover:underline">
        {item.nft.name}
      </Link>
    </p>
  )
}

type LineNoticesProps = PartProps & {
  priceChange?: PriceChange
  onAdjust: (item: CartItem) => void
}

// Estado da linha em texto, não só cor: esgotado, estoque insuficiente e preço atualizado.
function LineNotices({ item, priceChange, onAdjust }: LineNoticesProps) {
  return (
    <>
      {item.availability === 'sold_out' ? (
        <>
          <PriceChangedNotice kind="sold-out" />
          <p className="text-caption-md text-muted-foreground">Remova este item para finalizar.</p>
        </>
      ) : null}

      {item.availability === 'insufficient' && item.available !== null ? (
        <div className="flex flex-wrap items-center gap-2 text-caption-md">
          <span>Restam {item.available}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => onAdjust(item)}
          >
            Ajustar para {item.available}
          </Button>
        </div>
      ) : null}

      {priceChange !== undefined ? (
        <p className="flex items-center gap-1 text-caption-md text-muted-foreground">
          <RefreshCwIcon aria-hidden="true" className="size-3 shrink-0" />
          Preço atualizado: {formatEth(priceChange.from)} → {formatEth(priceChange.to)}
        </p>
      ) : null}
    </>
  )
}

type LineQuantityProps = PartProps & {
  onQuantityChange: (item: CartItem, quantity: number) => void
}

function LineQuantity({ item, className, onQuantityChange }: LineQuantityProps) {
  const name = item.nft.name
  const max = item.available ?? MAX_PER_PURCHASE
  let hint: string | undefined
  if (item.quantity >= max) {
    hint =
      item.available === null
        ? `Máximo por compra: ${MAX_PER_PURCHASE}`
        : `Máximo disponível: ${item.available}`
  }

  return (
    <div
      role="group"
      aria-label={`Quantidade de ${name}, edição ${item.edition.label}`}
      className={className}
    >
      <QuantityStepper
        size="sm"
        min={1}
        max={max}
        value={item.quantity}
        label={`Quantidade de ${name}, edição ${item.edition.label}`}
        hint={hint}
        onChange={(quantity) => onQuantityChange(item, quantity)}
      />
    </div>
  )
}

type LineRemoveProps = PartProps & {
  onRemove: (item: CartItem) => void
}

function LineRemove({ item, className, onRemove }: LineRemoveProps) {
  return (
    <Button
      type="button"
      variant="icon"
      size="icon"
      aria-label={`Remover ${item.nft.name}, edição ${item.edition.label}`}
      data-remove-for={item.id}
      onClick={() => onRemove(item)}
      className={cn('size-11', className)}
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  )
}

// Linha do carrinho: `cart-row` é a linha da tabela (desktop); `cart-card` é o card da lista (mobile).
export function LineItem({
  variant,
  item,
  priceChange,
  busy = false,
  onQuantityChange,
  onRemove,
  onAdjust,
}: LineItemProps) {
  const isSoldOut = item.availability === 'sold_out'
  const total = (
    <p
      aria-busy={busy}
      className={cn(
        'font-bold text-primary',
        isSoldOut && 'text-muted-foreground line-through',
        busy && 'opacity-60',
      )}
    >
      {formatEth(item.lineTotal)}
      {isSoldOut ? <span className="sr-only"> fora do total</span> : null}
    </p>
  )

  if (variant === 'cart-row') {
    return (
      <tr className="bg-card">
        <td className="py-0 pr-3 pl-0">
          <div className="flex items-center gap-4">
            <LineThumb item={item} className="size-[70px] overflow-hidden rounded-media" />
            <div className="flex min-w-0 flex-col gap-1">
              <LineName item={item} />
              <p className="text-caption-md text-muted-foreground">
                ID do token: {item.nft.tokenId}
              </p>
              <p className="text-caption-md text-muted-foreground">Edição {item.edition.label}</p>
              <LineNotices item={item} priceChange={priceChange} onAdjust={onAdjust} />
            </div>
          </div>
        </td>
        <td className="px-3 py-0">
          <p className="font-bold text-primary">{formatEth(item.unitPrice)}</p>
        </td>
        <td className="px-3 py-0">
          <LineQuantity item={item} onQuantityChange={onQuantityChange} />
        </td>
        <td className="px-3 py-0">{total}</td>
        <td className="py-0 pr-3 pl-3">
          <LineRemove item={item} className="bg-transparent" onRemove={onRemove} />
        </td>
      </tr>
    )
  }

  return (
    <li className="relative flex min-h-[94px] overflow-hidden rounded-card bg-card">
      <LineThumb item={item} className="w-[94px] self-stretch overflow-hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 pr-12">
        <LineName item={item} />
        <p className="text-caption-md text-muted-foreground">Edição: {item.edition.label}</p>
        <LineNotices item={item} priceChange={priceChange} onAdjust={onAdjust} />
        <div className="mt-auto text-base">{total}</div>
      </div>
      <LineQuantity
        item={item}
        className="absolute right-3 bottom-3"
        onQuantityChange={onQuantityChange}
      />
      <LineRemove item={item} className="absolute top-1 right-1" onRemove={onRemove} />
    </li>
  )
}
