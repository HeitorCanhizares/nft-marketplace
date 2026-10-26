import { HeartIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  pressed: boolean
  onToggle: () => void
  label: string
  variant?: 'circle' | 'square' | 'text'
  busy?: boolean
  className?: string
}

export function FavoriteButton({
  pressed,
  onToggle,
  label,
  variant = 'circle',
  busy = false,
  className,
}: FavoriteButtonProps) {
  const isCircle = variant === 'circle'
  const isText = variant === 'text'

  return (
    <Button
      type="button"
      variant={isText ? 'outline' : 'icon'}
      size={isText ? 'lg' : 'icon'}
      aria-label={`Favoritar ${label}`}
      aria-pressed={pressed}
      aria-busy={busy || undefined}
      onClick={() => {
        if (!busy) onToggle()
      }}
      className={cn(
        isText
          ? 'rounded-mobile border-border bg-card px-4 text-foreground lg:rounded-lg'
          : isCircle
            ? 'size-7 rounded-full bg-secondary text-primary'
            : 'size-8.75 rounded-lg border border-border bg-card text-foreground',
        className,
      )}
    >
      <HeartIcon
        aria-hidden="true"
        className={cn(
          isText ? 'size-5' : isCircle ? 'size-4' : 'size-5',
          pressed && 'fill-current',
        )}
      />
      {isText ? <span>Favoritar</span> : null}
    </Button>
  )
}
