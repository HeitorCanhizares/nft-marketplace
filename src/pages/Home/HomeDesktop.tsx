import { BlogCard } from '@/components/shared/BlogCard'
import { BlogCardSkeleton } from '@/components/shared/BlogCardSkeleton'
import { CatalogSection } from '@/components/shared/CatalogSection'
import { ErrorState } from '@/components/shared/ErrorState'
import { FeaturedNftCard } from '@/components/shared/FeaturedNftCard'
import { FeaturedNftCardSkeleton } from '@/components/shared/FeaturedNftCardSkeleton'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { HeroBanner } from '@/components/shared/HeroBanner'
import { HeroBannerSkeleton } from '@/components/shared/HeroBannerSkeleton'
import { PromoCard } from '@/components/shared/PromoCard'
import { PromoCardSkeleton } from '@/components/shared/PromoCardSkeleton'
import { useCatalogPage } from '@/hooks/useCatalogPage'
import { useHome } from '@/hooks/useHome'
import type { HomeSearch } from '@/types/catalog'

// Início do desktop: hero, filtros com o destaque, catálogo, promos e blog.
export function HomeDesktop({ search }: { search: HomeSearch }) {
  const home = useHome()
  const page = useCatalogPage(search)
  const data = home.data

  return (
    <div className="container-page flex flex-col gap-24">
      {home.isError ? (
        <ErrorState
          as="h2"
          title="Não foi possível carregar os destaques"
          onRetry={() => {
            void home.refetch()
          }}
          retrying={home.isFetching}
        />
      ) : data ? (
        <HeroBanner slides={data.hero} variant="desktop" onExplore={page.onExplore} />
      ) : (
        <HeroBannerSkeleton variant="desktop" />
      )}

      <div className="grid grid-cols-[310px_1fr] items-start gap-12">
        <div className="flex flex-col gap-6">
          <FilterPanel
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
          />
          {home.isError ? null : data ? (
            <FeaturedNftCard nft={data.featured} />
          ) : (
            <FeaturedNftCardSkeleton />
          )}
        </div>

        <CatalogSection
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
          pagination={{
            page: page.page,
            totalPages: page.totalPages ?? 0,
            getHref: page.getHref,
            onPageChange: page.onPageChange,
          }}
          titleRef={page.titleRef}
          gridRef={page.gridRef}
        />
      </div>

      {home.isError ? null : (
        <>
          <div className="grid grid-cols-2 gap-7">
            {data
              ? data.promos.map((promo) => <PromoCard key={promo.id} promo={promo} />)
              : Array.from({ length: 2 }, (_, index) => <PromoCardSkeleton key={index} />)}
          </div>

          <section aria-labelledby="blog-titulo">
            <h2 id="blog-titulo" className="text-center text-section font-bold text-foreground">
              Diário da Cunhagem
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Histórias, guias e insights para colecionadores sobre o universo da propriedade
              digital.
            </p>
            <ul className="mt-10.5 grid grid-cols-4 gap-6">
              {data
                ? data.posts.map((post) => (
                    <li key={post.id}>
                      <BlogCard post={post} />
                    </li>
                  ))
                : Array.from({ length: 4 }, (_, index) => (
                    <li key={index}>
                      <BlogCardSkeleton />
                    </li>
                  ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
