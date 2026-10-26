import { CheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FilterOption = {
  id: string
  name: string
  count: number
}

type FilterOptionListProps = {
  legend: string
  options: FilterOption[]
  value?: string
  onChange: (id: string | undefined) => void
  className?: string
}

export function FilterOptionList({
  legend,
  options,
  value,
  onChange,
  className,
}: FilterOptionListProps) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="text-lg font-bold">{legend}</legend>

      <ul className="mt-2 flex flex-col">
        {options.map((option) => {
          const active = option.id === value
          // Contagem zero continua focável (aria-disabled), mas não aplica nada.
          const disabled = option.count === 0 && !active

          return (
            <li key={option.id}>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={active}
                aria-disabled={disabled || undefined}
                aria-label={`${option.name}, ${option.count} NFTs`}
                onClick={() => {
                  if (disabled) return
                  onChange(active ? undefined : option.id)
                }}
                className={cn(
                  'relative -mx-3 h-10 w-full justify-between px-3 text-body aria-disabled:opacity-100',
                  active && 'font-bold text-primary',
                  !active && !disabled && 'font-normal',
                  disabled && 'text-tan',
                )}
              >
                {active ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                    />
                    <CheckIcon aria-hidden="true" className="absolute left-1 size-3.5" />
                  </>
                ) : null}
                <span>{option.name}</span>
                <span aria-hidden="true" className="font-bold">
                  ({option.count})
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
