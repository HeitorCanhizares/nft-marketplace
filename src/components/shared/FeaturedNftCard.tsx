import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'
import type { NftSummary } from '@/types/nft'

type FeaturedNftCardProps = {
  nft: NftSummary
  className?: string
}

// Cartão inteiro é um link para o detalhe do NFT em destaque.
export function FeaturedNftCard({ nft, className }: FeaturedNftCardProps) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      className={cn(
        'flex w-full flex-col bg-card outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className="flex h-26 flex-col items-stretch gap-2 px-5 pt-7">
        <p className="self-start text-heading leading-8 font-bold text-primary">NFT EM DESTAQUE</p>
        <p className="text-center text-featured leading-7 font-bold text-foreground">
          OFERTA LIMITADA
        </p>
      </div>
      <img
        src={nft.image.src}
        alt={nft.image.alt}
        loading="lazy"
        className="h-91.5 w-full rounded-panel object-cover"
      />
      <span className="sr-only">: {nft.name}</span>
    </Link>
  )
}
