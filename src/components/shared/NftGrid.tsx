import type { Ref } from 'react'

import { NftCard } from '@/components/shared/NftCard'
import { NftCardSkeleton } from '@/components/shared/NftCardSkeleton'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/types/nft'

type NftGridProps = {
  // Indefinido = carregando.
  items?: NftSummary[]
  loadingCount?: number
  busy?: boolean
  updatedIds?: ReadonlySet<string>
  pendingFavoriteIds?: ReadonlySet<string>
  pendingCartIds?: ReadonlySet<string>
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  className?: string
  ref?: Ref<HTMLUListElement>
}

const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 [&>li:nth-child(even)]:translate-y-8 lg:grid-cols-3 lg:gap-x-8.5 lg:gap-y-16 lg:pb-0 lg:[&>li:nth-child(even)]:translate-y-0'

export function NftGrid({
  items,
  loadingCount = 9,
  busy = false,
  updatedIds,
  pendingFavoriteIds,
  pendingCartIds,
  onAddToCart,
  onToggleFavorite,
  className,
  ref,
}: NftGridProps) {
  const isLoading = items === undefined

  return (
    <>
      {isLoading ? (
        <span className="sr-only" role="status">
          Carregando NFTs…
        </span>
      ) : null}

      <ul
        ref={ref}
        aria-busy={busy || undefined}
        className={cn(
          gridClass,
          busy && 'opacity-60 transition-opacity motion-reduce:transition-none',
          className,
        )}
      >
        {isLoading
          ? Array.from({ length: loadingCount }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))
          : items.map((nft) => (
              <li key={nft.id}>
                <NftCard
                  nft={nft}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  updated={updatedIds?.has(nft.id)}
                  favoriteBusy={pendingFavoriteIds?.has(nft.id)}
                  cartBusy={pendingCartIds?.has(nft.id)}
                />
              </li>
            ))}
      </ul>
    </>
  )
}
