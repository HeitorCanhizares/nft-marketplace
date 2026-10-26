import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'

import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { Edition } from '@/types/nft'

type EditionSelectorProps = {
  editions: readonly Edition[]
  value: string
  onChange: (editionId: string) => void
  className?: string
}

// Pílulas das edições. Esgotada: desabilitada e com o texto "Esgotado" visível.
export function EditionSelector({ editions, value, onChange, className }: EditionSelectorProps) {
  return (
    <RadioGroup
      aria-label="Edição"
      orientation="horizontal"
      value={value}
      onValueChange={onChange}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {editions.map((edition) => {
        const soldOut = edition.available === 0
        return (
          <RadioGroupPrimitive.Item
            key={edition.id}
            value={edition.id}
            disabled={soldOut}
            className={cn(
              'inline-flex min-h-11 min-w-16 flex-col items-center justify-center rounded-mobile border border-border-soft bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors outline-none select-none lg:min-h-9 lg:rounded-lg',
              'focus-visible:ring-2 focus-visible:ring-ring',
              'data-[state=checked]:border-primary',
              'disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60',
            )}
          >
            <span>{edition.label}</span>
            {soldOut ? (
              <span className="text-caption-md text-muted-foreground">Esgotado</span>
            ) : null}
          </RadioGroupPrimitive.Item>
        )
      })}
    </RadioGroup>
  )
}
