import { StarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type RatingStarsProps = {
  average: number
  count: number
  variant?: 'stars' | 'pill'
  onClick?: () => void
  className?: string
}

function reviewsText(count: number): string {
  return count === 1 ? '1 avaliação de colecionadores' : `${count} avaliações de colecionadores`
}

function reviewsActionLabel(count: number, average: number): string {
  const reviews = count === 1 ? '1 avaliação' : `${count} avaliações`
  return `Ver ${reviews} de colecionadores, nota ${average.toFixed(1)} de 5`
}

// Nota do NFT: estrelas com a contagem (desktop) ou pílula "★ 4.8 (19)" (mobile).
export function RatingStars({
  average,
  count,
  variant = 'stars',
  onClick,
  className,
}: RatingStarsProps) {
  if (count === 0) {
    return <span className={cn('text-sm text-muted-foreground', className)}>Sem avaliações</span>
  }

  const content =
    variant === 'pill' ? (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
        <span aria-hidden="true" className="text-primary">
          ★
        </span>
        {`${average.toFixed(1)} (${count})`}
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="inline-flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, index) => {
            const filled = index < Math.round(average)
            return (
              <StarIcon
                key={index}
                className={cn(
                  'size-4',
                  filled ? 'fill-current text-primary' : 'text-border-strong',
                )}
              />
            )
          })}
        </span>
        <span>{reviewsText(count)}</span>
      </span>
    )

  if (onClick === undefined) {
    return <span className={className}>{content}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={reviewsActionLabel(count, average)}
      className={cn(
        'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {content}
    </button>
  )
}
