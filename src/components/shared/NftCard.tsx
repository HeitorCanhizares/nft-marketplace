import { Link } from '@tanstack/react-router'

import { NftCardActions } from '@/components/shared/NftCardActions'
import { PriceChangedNotice } from '@/components/shared/PriceChangedNotice'
import { PriceTag } from '@/components/shared/PriceTag'
import { RarityBadge } from '@/components/shared/RarityBadge'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/types/nft'

type NftCardProps = {
  nft: NftSummary
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  updated?: boolean
  favoriteBusy?: boolean
  cartBusy?: boolean
  className?: string
}

export function NftCard({
  nft,
  onAddToCart,
  onToggleFavorite,
  updated = false,
  favoriteBusy = false,
  cartBusy = false,
  className,
}: NftCardProps) {
  const soldOut = nft.soldOut === true

  return (
    <article className={cn('group relative', className)} data-nft-id={nft.id}>
      <div className="relative flex aspect-[43/50] items-center justify-center bg-card max-lg:aspect-[7/8] max-lg:rounded-card">
        <img
          src={nft.image.src}
          alt={nft.image.alt}
          width={250}
          height={250}
          loading="lazy"
          decoding="async"
          className="aspect-square w-[calc(100%-0.5rem)] rounded-media object-cover"
        />

        {nft.rarity === 'rare' ? (
          <RarityBadge className="absolute top-3.5 left-0 max-lg:top-4" />
        ) : null}

        <NftCardActions
          nftId={nft.id}
          name={nft.name}
          isFavorite={nft.isFavorite === true}
          soldOut={soldOut}
          favoriteBusy={favoriteBusy}
          cartBusy={cartBusy}
          onAddToCart={() => {
            onAddToCart(nft)
          }}
          onToggleFavorite={() => {
            onToggleFavorite(nft)
          }}
        />
      </div>

      <div className="mt-3 max-lg:px-2">
        <h3 className="text-body lg:text-base">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            data-nft-card-link
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {nft.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriceTag price={nft.price} previousPrice={nft.previousPrice} />
          {updated ? <PriceChangedNotice kind="updated" /> : null}
          {soldOut ? <PriceChangedNotice kind="sold-out" /> : null}
        </div>
      </div>
    </article>
  )
}
