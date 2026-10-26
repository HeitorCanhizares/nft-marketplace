import { useId } from 'react'

import { ErrorState } from '@/components/shared/ErrorState'
import { NftCard } from '@/components/shared/NftCard'
import { NftCardSkeleton } from '@/components/shared/NftCardSkeleton'
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/types/nft'

type NftCarouselProps = {
  title: string
  items?: NftSummary[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  favoriteBusyIds?: ReadonlySet<string>
  cartBusyIds?: ReadonlySet<string>
  className?: string
}

const LOADING_COUNT = 5

// Carrossel de cards relacionados: 5 por vez no desktop. Erro e vazio ficam dentro da seção.
export function NftCarousel({
  title,
  items,
  isLoading,
  isError,
  onRetry,
  onAddToCart,
  onToggleFavorite,
  favoriteBusyIds,
  cartBusyIds,
  className,
}: NftCarouselProps) {
  const titleId = useId()
  const hasItems = items !== undefined && items.length > 0

  if (!isLoading && !isError && !hasItems) return null

  return (
    <section aria-labelledby={titleId} className={cn('w-full', className)}>
      <h2
        id={titleId}
        className="mb-7 border-b border-border-soft pb-2 text-base font-bold text-primary"
      >
        {title}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: LOADING_COUNT }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          as="h3"
          title="Não foi possível carregar os NFTs relacionados"
          message="Verifique sua conexão e tente novamente."
          onRetry={onRetry}
          className="py-6"
        />
      ) : (
        <Carousel opts={{ align: 'start' }}>
          <CarouselContent>
            {items?.map((nft) => (
              <CarouselItem key={nft.id} className="basis-1/2 lg:basis-1/5">
                <NftCard
                  nft={nft}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  favoriteBusy={favoriteBusyIds?.has(nft.id) ?? false}
                  cartBusy={cartBusyIds?.has(nft.id) ?? false}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots className="mt-6" />
        </Carousel>
      )}
    </section>
  )
}
