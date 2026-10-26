import { useId } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  hint?: string
  size?: 'md' | 'sm'
  label?: string
  className?: string
}

// Botões − e + com o número no meio. Só inteiros; nunca passa de max nem fica abaixo de min.
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  hint,
  size = 'md',
  label = 'Quantidade',
  className,
}: QuantityStepperProps) {
  const hintId = useId()
  const noRoom = max < min
  const canDecrement = !noRoom && value > min
  const canIncrement = !noRoom && value < max
  const isSmall = size === 'sm'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="default"
          size="icon"
          aria-label="Diminuir quantidade"
          disabled={!canDecrement}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={cn('rounded-full', isSmall ? 'size-8' : 'size-10')}
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <output
          aria-label={label}
          className={cn(
            'min-w-8 text-center font-medium text-foreground tabular-nums',
            isSmall ? 'text-sm' : 'text-base',
          )}
        >
          {value}
        </output>
        <Button
          type="button"
          variant="default"
          size="icon"
          aria-label="Aumentar quantidade"
          aria-describedby={hint ? hintId : undefined}
          disabled={!canIncrement}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={cn('rounded-full', isSmall ? 'size-8' : 'size-10')}
        >
          <PlusIcon aria-hidden="true" />
        </Button>
      </div>
      {hint ? (
        <p id={hintId} className="text-caption-md text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
