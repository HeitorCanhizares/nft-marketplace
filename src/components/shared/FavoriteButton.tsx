import { HeartIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  pressed: boolean
  onToggle: () => void
  label: string
  variant?: 'circle' | 'square'
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

  return (
    <Button
      type="button"
      variant="icon"
      size="icon"
      aria-label={`Favoritar ${label}`}
      aria-pressed={pressed}
      aria-busy={busy || undefined}
      onClick={() => {
        if (!busy) onToggle()
      }}
      className={cn(
        isCircle
          ? 'size-7 rounded-full bg-secondary text-primary'
          : 'size-8.75 rounded-lg border border-border bg-card text-foreground',
        className,
      )}
    >
      <HeartIcon
        aria-hidden="true"
        className={cn(isCircle ? 'size-4' : 'size-5', pressed && 'fill-current')}
      />
    </Button>
  )
}
