import { Link } from '@tanstack/react-router'
import { SearchIcon, ShoppingCartIcon } from 'lucide-react'

import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NftCardActionsProps = {
  nftId: string
  name: string
  isFavorite: boolean
  soldOut: boolean
  onAddToCart: () => void
  onToggleFavorite: () => void
  favoriteBusy?: boolean
  cartBusy?: boolean
  className?: string
}

const squareButtonClass = 'size-8.75 rounded-lg border border-border bg-card text-foreground'

export function NftCardActions({
  nftId,
  name,
  isFavorite,
  soldOut,
  onAddToCart,
  onToggleFavorite,
  favoriteBusy = false,
  cartBusy = false,
  className,
}: NftCardActionsProps) {
  return (
    <>
      <div
        className={cn(
          'absolute inset-x-0 bottom-1.75 z-10 flex justify-center gap-2.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none max-lg:hidden',
          className,
        )}
      >
        {soldOut ? (
          <Button
            type="button"
            variant="icon"
            size="icon"
            aria-disabled="true"
            className={cn(squareButtonClass, 'w-auto px-3 text-caption')}
          >
            Esgotado
          </Button>
        ) : (
          <Button
            type="button"
            variant="icon"
            size="icon"
            aria-label={`Adicionar ${name} ao carrinho`}
            aria-busy={cartBusy || undefined}
            onClick={() => {
              if (!cartBusy) onAddToCart()
            }}
            className={squareButtonClass}
          >
            <ShoppingCartIcon aria-hidden="true" className="size-5" />
          </Button>
        )}

        <FavoriteButton
          variant="square"
          pressed={isFavorite}
          label={name}
          busy={favoriteBusy}
          onToggle={onToggleFavorite}
        />

        <Link
          to="/nft/$nftId"
          params={{ nftId }}
          aria-label={`Ver ${name}`}
          className={cn(squareButtonClass, 'inline-flex items-center justify-center')}
        >
          <SearchIcon aria-hidden="true" className="size-5" />
        </Link>
      </div>

      <FavoriteButton
        variant="circle"
        pressed={isFavorite}
        label={name}
        busy={favoriteBusy}
        onToggle={onToggleFavorite}
        className="absolute top-3 right-2.5 z-10 lg:hidden"
      />
    </>
  )
}
