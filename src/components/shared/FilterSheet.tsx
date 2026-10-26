import { Settings2Icon } from 'lucide-react'

import { FilterPanel, type FilterPanelProps } from '@/components/shared/FilterPanel'
import { SortSelect } from '@/components/shared/SortSelect'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { CatalogSort } from '@/types/catalog'

type FilterSheetProps = Omit<FilterPanelProps, 'variant'> & {
  sort: CatalogSort
  onSortChange: (sort: CatalogSort) => void
  // Resultados atuais, para o texto do botão de aplicar.
  total?: number
  activeCount: number
  className?: string
}

function resultsLabel(total: number | undefined): string {
  if (total === undefined) return 'Ver resultados'
  if (total === 0) return 'Nenhum resultado'
  if (total === 1) return 'Ver 1 resultado'
  return `Ver ${total} resultados`
}

export function FilterSheet({
  sort,
  onSortChange,
  total,
  activeCount,
  hasActiveFilters,
  onClear,
  className,
  ...panelProps
}: FilterSheetProps) {
  const triggerLabel = activeCount > 0 ? `Filtros, ${activeCount} ativos` : 'Filtros'

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="gradient"
          size="icon"
          aria-label={triggerLabel}
          className={cn('size-11.25 rounded-mobile text-foreground', className)}
        >
          <Settings2Icon aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-hidden p-0">
        <SheetHeader className="px-5 pt-5">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription className="sr-only">
            Filtre e ordene os NFTs. As escolhas valem na hora.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 py-6">
          <SortSelect variant="field" value={sort} onValueChange={onSortChange} />
          <FilterPanel
            {...panelProps}
            variant="sheet"
            hasActiveFilters={hasActiveFilters}
            onClear={onClear}
          />
        </div>

        <SheetFooter className="grid grid-cols-2 gap-3 border-t border-border p-5">
          <Button
            type="button"
            variant="outline"
            aria-disabled={!hasActiveFilters || undefined}
            onClick={() => {
              if (hasActiveFilters) onClear()
            }}
          >
            Limpar filtros
          </Button>
          <SheetClose asChild>
            <Button type="button">{resultsLabel(total)}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
