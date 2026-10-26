import type { ComponentProps } from 'react'
import { CheckIcon, ShoppingCartIcon } from 'lucide-react'

import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { PriceTag } from '@/components/shared/PriceTag'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Espaço que a página reserva embaixo para o conteúdo não ficar atrás da barra (só mobile).
export const BUY_BAR_SPACE_CLASS = 'pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-0'

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
        'fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Qtd.</span>
          <QuantityStepper {...stepper} size="sm" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriceTag price={price} />
          {updated ? <PriceChangedNotice kind="updated" /> : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {soldOut ? (
          <Button type="button" disabled className="h-11 flex-1">
            Esgotado
          </Button>
        ) : (
          <Button
            type="button"
            className="h-14 flex-1 rounded-full"
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
          className="size-14 rounded-full"
        >
          {added ? <CheckIcon aria-hidden="true" /> : <ShoppingCartIcon aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}
