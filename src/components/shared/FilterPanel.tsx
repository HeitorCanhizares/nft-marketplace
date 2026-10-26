import { FilterOptionList } from '@/components/shared/FilterOptionList'
import { PriceRangeFilter } from '@/components/shared/PriceRangeFilter'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { CatalogFacets, Network } from '@/types/nft'

const NETWORKS: readonly Network[] = ['ethereum', 'polygon', 'solana']

function toNetwork(id: string | undefined): Network | undefined {
  return NETWORKS.find((network) => network === id)
}

export type FilterPanelProps = {
  // Indefinido = carregando.
  facets?: CatalogFacets
  collection?: string
  network?: Network
  priceMin?: number
  priceMax?: number
  onCollectionChange: (id?: string) => void
  onNetworkChange: (id?: Network) => void
  onPriceApply: (range: { min?: number; max?: number }) => void
  onClear: () => void
  hasActiveFilters: boolean
  variant?: 'sidebar' | 'sheet'
  className?: string
}

export function FilterPanel({
  facets,
  collection,
  network,
  priceMin,
  priceMax,
  onCollectionChange,
  onNetworkChange,
  onPriceApply,
  onClear,
  hasActiveFilters,
  variant = 'sidebar',
  className,
}: FilterPanelProps) {
  const isSidebar = variant === 'sidebar'

  const groups =
    facets === undefined ? (
      <div role="status" aria-busy="true" className="flex flex-col gap-8">
        <span className="sr-only">Carregando filtros…</span>
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    ) : (
      <>
        <FilterOptionList
          legend="Coleções"
          options={facets.collections}
          value={collection}
          onChange={onCollectionChange}
        />

        <PriceRangeFilter
          key={JSON.stringify([facets.priceRange, priceMin, priceMax])}
          bounds={facets.priceRange}
          value={{ min: priceMin, max: priceMax }}
          onApply={onPriceApply}
        />

        <FilterOptionList
          legend="Rede"
          options={facets.networks}
          value={network}
          onChange={(id) => {
            onNetworkChange(toNetwork(id))
          }}
        />
      </>
    )

  if (!isSidebar) {
    return <div className={cn('flex flex-col gap-8', className)}>{groups}</div>
  }

  return (
    <aside aria-label="Filtros" className={cn('bg-card px-5 pt-3.5 pb-5.5', className)}>
      <div className="flex flex-col gap-8">
        {groups}

        {hasActiveFilters ? (
          <Button type="button" variant="link" onClick={onClear} className="w-fit">
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </aside>
  )
}
