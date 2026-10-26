import { CatalogSection } from '@/components/shared/CatalogSection'
import { ErrorState } from '@/components/shared/ErrorState'
import { FilterSheet } from '@/components/shared/FilterSheet'
import { HeroBanner } from '@/components/shared/HeroBanner'
import { HeroBannerSkeleton } from '@/components/shared/HeroBannerSkeleton'
import { SearchInput } from '@/components/shared/SearchInput'
import { useCatalogPage } from '@/hooks/useCatalogPage'
import { useHome } from '@/hooks/useHome'
import type { HomeSearch } from '@/types/catalog'

// Início do mobile: busca com filtros, hero em card e catálogo com "Carregar mais".
export function HomeMobile({ search }: { search: HomeSearch }) {
  const home = useHome()
  const page = useCatalogPage(search)
  const data = home.data
  // O erro só aparece quando não há dados (nem em cache).
  const failed = home.isError && !data

  return (
    <div className="flex flex-col gap-4 px-6 pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2.25">
        <SearchInput variant="bar" initialQuery={search.q} onSearch={page.onSearch} />
        <FilterSheet
          facets={page.facets}
          collection={search.colecao}
          network={search.rede}
          priceMin={search.precoMin}
          priceMax={search.precoMax}
          onCollectionChange={page.onCollectionChange}
          onNetworkChange={page.onNetworkChange}
          onPriceApply={page.onPriceApply}
          onClear={page.onClearFilters}
          hasActiveFilters={page.hasActiveFilters}
          sort={page.sort}
          onSortChange={page.onSortChange}
          total={page.total}
          activeCount={page.activeCount}
        />
      </div>

      {failed ? (
        <ErrorState
          as="h2"
          title="Não foi possível carregar os destaques"
          className="py-8"
          onRetry={() => {
            void home.refetch()
          }}
          retrying={home.isFetching}
        />
      ) : data ? (
        <HeroBanner slides={data.hero} variant="mobile" onExplore={page.onExplore} />
      ) : (
        <HeroBannerSkeleton variant="mobile" />
      )}

      <CatalogSection
        className="pt-0.75"
        favoritesMode={page.favoritesMode}
        isDesktop={page.isDesktop}
        tab={page.tab}
        onTabChange={page.onTabChange}
        sort={page.sort}
        onSortChange={page.onSortChange}
        status={page.status}
        items={page.items}
        busy={page.busy}
        updatedIds={page.updatedIds}
        pendingFavoriteIds={page.pendingFavoriteIds}
        pendingCartIds={page.pendingCartIds}
        onAddToCart={page.onAddToCart}
        onToggleFavorite={page.onToggleFavorite}
        onRetry={page.onRetry}
        retrying={page.retrying}
        hasActiveFilters={page.hasActiveFilters}
        onClearFilters={page.onClearFilters}
        loadMore={{
          onLoadMore: page.onLoadMore,
          loading: page.loadingMore,
          hasMore: page.hasMore,
        }}
        titleRef={page.titleRef}
        gridRef={page.gridRef}
      />
    </div>
  )
}
