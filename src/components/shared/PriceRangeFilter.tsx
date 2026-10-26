import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type PriceRange = { min?: number; max?: number }

type PriceRangeFilterProps = {
  bounds: { min: string; max: string }
  // Faixa aplicada, vinda da URL.
  value?: PriceRange
  onApply: (range: PriceRange) => void
  className?: string
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

// Quem usa passa `key` com bounds e value: o rascunho reinicia quando a faixa aplicada muda.
export function PriceRangeFilter({ bounds, value, onApply, className }: PriceRangeFilterProps) {
  const id = useId()
  const titleId = `${id}-title`
  const textId = `${id}-text`

  // O Slider só aceita number; a conversão é só para o controle.
  const min = Number(bounds.min)
  const max = Number(bounds.max)
  const appliedMin = value?.min ?? min
  const appliedMax = value?.max ?? max

  const [draft, setDraft] = useState<[number, number]>([appliedMin, appliedMax])
  const [draftMin, draftMax] = draft

  const unchanged = draftMin === appliedMin && draftMax === appliedMax

  function handleApply() {
    if (unchanged) return
    onApply({
      min: draftMin === min ? undefined : draftMin,
      max: draftMax === max ? undefined : draftMax,
    })
  }

  return (
    <div role="group" aria-labelledby={titleId} className={cn('flex flex-col gap-3', className)}>
      <p id={titleId} className="text-lg font-bold">
        Faixa de preço
      </p>

      <Slider
        min={min}
        max={max}
        step={0.01}
        value={draft}
        disabled={bounds.min === bounds.max}
        minStepsBetweenThumbs={0}
        aria-describedby={textId}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        onValueChange={(next) => {
          setDraft([next[0] ?? min, next[1] ?? max])
        }}
        className="mt-0.5 mb-2"
      />

      <p id={textId} aria-live="off" className="text-body text-foreground">
        {`Preço: ${formatPrice(draftMin)} - ${formatPrice(draftMax)} ETH`}
      </p>

      <Button
        type="button"
        aria-disabled={unchanged || undefined}
        onClick={handleApply}
        className="h-9 w-fit px-3 text-base"
      >
        Aplicar
      </Button>
    </div>
  )
}
