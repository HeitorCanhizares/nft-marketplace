import { Link } from '@tanstack/react-router'
import { RefreshCwIcon, Trash2Icon } from 'lucide-react'

import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/formatEth'
import { MAX_PER_PURCHASE } from '@/lib/maxQuantity'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types/cart'
import type { OrderItemSnapshot } from '@/types/order'

export type PriceChange = { from: string; to: string }

export type CartLineItemVariant = 'cart-row' | 'cart-card'

export type LineItemVariant = CartLineItemVariant | 'summary' | 'receipt'

type CartLineItemProps = {
  variant: CartLineItemVariant
  item: CartItem
  priceChange?: PriceChange
  busy?: boolean
  onQuantityChange: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
  onAdjust: (item: CartItem) => void
}

// Revisão e Pagamento: só leitura, sem handlers.
type SummaryLineItemProps = {
  variant: 'summary'
  item: CartItem
}

// Recibo do pedido: só leitura, a partir do snapshot (nunca de um CartItem).
type ReceiptLineItemProps = {
  variant: 'receipt'
  item: OrderItemSnapshot
}

type LineItemProps = CartLineItemProps | SummaryLineItemProps | ReceiptLineItemProps

type PartProps = {
  item: CartItem
  className?: string
}

type LineThumbProps = PartProps & {
  linked?: boolean
}

function LineThumb({ item, className, linked = true }: LineThumbProps) {
  if (!linked) {
    return (
      <div className={cn('shrink-0', className)}>
        <img src={item.nft.image.src} alt="" loading="lazy" className="size-full object-cover" />
      </div>
    )
  }

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

// Linha da revisão: miniatura sem link, nome, ID do token, "(x N)" e subtotal. Só leitura.
function SummaryLine({ item }: PartProps) {
  const isSoldOut = item.availability === 'sold_out'

  return (
    <li className="flex min-h-[70px] gap-2 bg-card">
      <LineThumb
        item={item}
        linked={false}
        className="ml-1 size-[70px] overflow-hidden rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2">
        <p className="font-bold text-foreground">{item.nft.name}</p>
        <p className="text-caption-md text-muted-foreground">ID do token: {item.nft.tokenId}</p>
        {isSoldOut ? <p className="text-caption-md text-muted-foreground">esgotado</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 pr-3">
        <p className="text-caption-md text-muted-foreground">(x {item.quantity})</p>
        <p
          className={cn(
            'font-bold text-primary',
            isSoldOut && 'text-muted-foreground line-through',
          )}
        >
          {formatEth(item.lineTotal)}
          {isSoldOut ? <span className="sr-only"> fora do total</span> : null}
        </p>
      </div>
    </li>
  )
}

// Recibo: miniatura sem link, nome, ID do token, edição, "(x N)" e subtotal. Só leitura.
// Desktop: grade de 3 colunas (mesma do cabeçalho do LineItemList). Mobile: cartão.
function ReceiptLine({ item }: { item: OrderItemSnapshot }) {
  return (
    <li className="grid min-h-[70px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 bg-card max-lg:overflow-hidden max-lg:rounded-card max-lg:pr-3 lg:grid-cols-[minmax(0,1fr)_90px_7rem] lg:gap-x-0">
      <div className="flex min-w-0 items-center gap-3 max-lg:col-start-1 max-lg:row-span-2 max-lg:row-start-1">
        <div className="size-[70px] shrink-0 overflow-hidden rounded-media max-lg:rounded-none">
          <img src={item.image.src} alt="" loading="lazy" className="size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-base font-bold break-words text-foreground">{item.name}</p>
          <p className="text-sm text-tan">ID do token: {item.tokenId}</p>
          <p className="text-sm text-tan">Edição {item.editionLabel}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground max-lg:col-start-2 max-lg:row-start-1 lg:text-center">
        (x {item.quantity})
      </p>
      <p className="text-subtitle font-bold text-price tabular-nums max-lg:col-start-2 max-lg:row-start-2 lg:text-right">
        {formatEth(item.lineTotal)}
      </p>
    </li>
  )
}

// Linha do carrinho: `cart-row` é a linha da tabela (desktop); `cart-card` é o card da lista (mobile).
// `summary` é a linha só de leitura da revisão. `receipt` é a linha só de leitura do recibo.
export function LineItem(props: LineItemProps) {
  if (props.variant === 'summary') {
    return <SummaryLine item={props.item} />
  }

  if (props.variant === 'receipt') {
    return <ReceiptLine item={props.item} />
  }

  const { variant, item, priceChange, busy = false, onQuantityChange, onRemove, onAdjust } = props
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
