import { useId, type Ref } from 'react'
import { Link } from '@tanstack/react-router'

import { CatalogPagination } from '@/components/shared/CatalogPagination'
import { CatalogTabs } from '@/components/shared/CatalogTabs'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadMoreButton } from '@/components/shared/LoadMoreButton'
import { NftGrid } from '@/components/shared/NftGrid'
import { SortSelect } from '@/components/shared/SortSelect'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CatalogSort, CatalogTab } from '@/types/catalog'
import type { NftSummary } from '@/types/nft'

type CatalogStatus = 'loading' | 'error' | 'empty' | 'ready'

type CatalogPaginationProps = {
  page: number
  totalPages: number
  getHref: (page: number) => string
  onPageChange: (page: number) => void
}

type CatalogLoadMore = {
  onLoadMore: () => void
  loading: boolean
  hasMore: boolean
}

type CatalogSectionProps = {
  favoritesMode: boolean
  isDesktop: boolean
  tab: CatalogTab
  onTabChange: (tab: CatalogTab) => void
  sort: CatalogSort
  onSortChange: (sort: CatalogSort) => void
  status: CatalogStatus
  // Indefinido = carregando.
  items?: NftSummary[]
  busy?: boolean
  updatedIds?: ReadonlySet<string>
  pendingFavoriteIds?: ReadonlySet<string>
  pendingCartIds?: ReadonlySet<string>
  onAddToCart: (nft: NftSummary) => void
  onToggleFavorite: (nft: NftSummary) => void
  onRetry: () => void
  retrying?: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
  // Desktop.
  pagination?: CatalogPaginationProps
  // Mobile.
  loadMore?: CatalogLoadMore
  titleRef?: Ref<HTMLHeadingElement>
  gridRef?: Ref<HTMLUListElement>
  className?: string
}

export function CatalogSection({
  favoritesMode,
  isDesktop,
  tab,
  onTabChange,
  sort,
  onSortChange,
  status,
  items,
  busy = false,
  updatedIds,
  pendingFavoriteIds,
  pendingCartIds,
  onAddToCart,
  onToggleFavorite,
  onRetry,
  retrying = false,
  hasActiveFilters,
  onClearFilters,
  pagination,
  loadMore,
  titleRef,
  gridRef,
  className,
}: CatalogSectionProps) {
  const titleId = useId()

  function renderContent() {
    if (status === 'loading') {
      return (
        <NftGrid
          loadingCount={isDesktop ? 9 : 6}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />
      )
    }

    if (status === 'error') {
      return (
        <ErrorState
          as="h3"
          title="Não foi possível carregar os NFTs"
          message="Verifique sua conexão e tente novamente."
          onRetry={onRetry}
          retrying={retrying}
        />
      )
    }

    if (status === 'empty') {
      return favoritesMode ? (
        <EmptyState
          as="h3"
          title="Você ainda não favoritou nenhum NFT"
          action={
            <Button asChild>
              <Link to="/" resetScroll={false}>
                Explorar NFTs
              </Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          as="h3"
          title="Nenhum NFT encontrado"
          description="Tente mudar os filtros ou a busca."
          action={
            hasActiveFilters ? (
              <Button type="button" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )
    }

    return (
      <>
        <NftGrid
          items={items}
          busy={busy}
          ref={gridRef}
          updatedIds={updatedIds}
          pendingFavoriteIds={pendingFavoriteIds}
          pendingCartIds={pendingCartIds}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />

        {isDesktop && pagination ? (
          <CatalogPagination
            className="mt-12"
            page={pagination.page}
            totalPages={pagination.totalPages}
            getHref={pagination.getHref}
            onPageChange={pagination.onPageChange}
          />
        ) : null}

        {!isDesktop && loadMore?.hasMore ? (
          <LoadMoreButton
            className="mt-8"
            onClick={loadMore.onLoadMore}
            loading={loadMore.loading}
          />
        ) : null}
      </>
    )
  }

  return (
    <section
      id="catalogo"
      aria-labelledby={titleId}
      className={cn('relative scroll-mt-8', className)}
    >
      <h2
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className={cn(
          'outline-none',
          favoritesMode ? 'mb-6 text-heading font-bold text-foreground' : 'sr-only',
        )}
      >
        {favoritesMode ? 'Seus favoritos' : 'Catálogo de NFTs'}
      </h2>

      <CatalogTabs
        value={tab}
        onValueChange={onTabChange}
        trailing={isDesktop ? <SortSelect value={sort} onValueChange={onSortChange} /> : null}
      >
        {renderContent()}
      </CatalogTabs>
    </section>
  )
}
