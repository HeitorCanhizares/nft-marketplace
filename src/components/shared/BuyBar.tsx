import type { ComponentProps } from 'react'
import { CheckIcon, ShoppingCartIcon } from 'lucide-react'

import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { PriceTag } from '@/components/shared/PriceTag'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Espaço que a página reserva embaixo para o conteúdo não ficar atrás da barra (só mobile).
export const BUY_BAR_SPACE_CLASS = 'pb-[calc(12rem+env(safe-area-inset-bottom))] lg:pb-0'

type BuyBarProps = {
  price: string
  stepper: ComponentProps<typeof QuantityStepper>
  onBuy: () => void
  onAddToCart: () => void
  canAdd: boolean
  soldOut: boolean
  pending: boolean
  added: boolean
  updated: boolean
  className?: string
}

// Barra fixa de compra do mobile: quantidade e preço, depois COMPRAR e o botão de carrinho.
export function BuyBar({
  price,
  stepper,
  onBuy,
  onAddToCart,
  canAdd,
  soldOut,
  pending,
  added,
  updated,
  className,
}: BuyBarProps) {
  return (
    <div
      aria-busy={pending || undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-card px-6 pt-1.5 pb-[max(35px,env(safe-area-inset-bottom))] shadow-[0_-12px_20px_rgba(0,0,0,0.25)] lg:hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Qtd.</span>
          <QuantityStepper {...stepper} size="sm" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriceTag price={price} className="text-xl" />
          {updated ? <PriceChangedNotice kind="updated" /> : null}
        </div>
      </div>

      <div className="mt-[22px] flex items-center gap-3">
        {soldOut ? (
          <Button type="button" disabled className="h-15 w-49 rounded-full">
            Esgotado
          </Button>
        ) : (
          <Button
            type="button"
            className="h-15 w-49 rounded-full"
            onClick={() => {
              if (!pending) onBuy()
            }}
          >
            Comprar NFT
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={added ? 'Adicionado ao carrinho' : 'Adicionar ao carrinho'}
          disabled={soldOut || !canAdd}
          onClick={() => {
            if (!pending) onAddToCart()
          }}
          className="size-15 rounded-full"
        >
          {added ? <CheckIcon aria-hidden="true" /> : <ShoppingCartIcon aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}
