import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { promoToSearch } from '@/lib/catalogOptions'
import { cn } from '@/lib/utils'
import type { Promo } from '@/types/nft'

type PromoCardProps = {
  promo: Promo
  className?: string
}

export function PromoCard({ promo, className }: PromoCardProps) {
  return (
    <article
      className={cn(
        'grid h-62.5 grid-cols-[287px_1fr] overflow-hidden rounded-lg bg-card',
        className,
      )}
    >
      <img
        src={promo.image.src}
        alt={promo.image.alt}
        loading="lazy"
        className="h-full w-full rounded-panel object-cover"
      />

      <div className="flex flex-col items-end justify-center gap-3 py-6 pr-7.5 pl-4 text-right">
        <h3 className="text-lg font-bold text-foreground">{promo.title}</h3>
        <p className="text-sm text-muted-foreground">{promo.text}</p>
        <Button asChild className="w-35">
          <Link
            to="/"
            search={promoToSearch(promo.query)}
            hash="catalogo"
            aria-label={`${promo.ctaLabel}: ${promo.title}`}
          >
            {promo.ctaLabel}
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </article>
  )
}
