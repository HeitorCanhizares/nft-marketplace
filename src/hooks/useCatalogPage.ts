import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

import { useAddToCart } from '@/hooks/useAddToCart'
import { useCatalog } from '@/hooks/useCatalog'
import { useCatalogFocus } from '@/hooks/useCatalogFocus'
import { useHomeNavigate } from '@/hooks/useHomeNavigate'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useLiveChanges } from '@/hooks/useLiveChanges'
import { useNftLiveEvents } from '@/hooks/useNftLiveEvents'
import { useNftSubscriptions } from '@/hooks/useNftSubscriptions'
import { useToggleFavorite } from '@/hooks/useToggleFavorite'
import { DEFAULT_SORT, DEFAULT_TAB } from '@/lib/catalogOptions'
import { hasActiveFilters as searchHasActiveFilters } from '@/schemas/catalog'
import type { CatalogSort, CatalogTab, HomeSearch } from '@/types/catalog'
import type { Network, NftSummary } from '@/types/nft'

export type CatalogStatus = 'loading' | 'error' | 'empty' | 'ready'

// Liga o catálogo da Início: URL, dados, ações, tempo real e foco. Devolve tudo pronto para CatalogSection e os filtros.
export function useCatalogPage(search: HomeSearch) {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const favoritesMode = search.favoritos === 1
  const tab: CatalogTab = search.aba ?? DEFAULT_TAB
  const sort: CatalogSort = search.ordem ?? DEFAULT_SORT
  const page = search.pagina ?? 1

  const { setFilters, setPage, clearFilters, explore } = useHomeNavigate(search)

  const query = useCatalog(search, isDesktop)
  const { data, items, isPlaceholderData, isFetching, isError, refetch } = query

  const status: CatalogStatus =
    items === undefined ? (isError ? 'error' : 'loading') : items.length === 0 ? 'empty' : 'ready'
  const busy = isPlaceholderData
  const retrying = isFetching && isError
  const facets = data?.facets
  const total = data?.total
  const totalPages = data?.totalPages

  useNftSubscriptions(items?.map((item) => item.id) ?? [])
  useNftLiveEvents()
  const { updatedIds } = useLiveChanges(
    isPlaceholderData ? undefined : items,
    JSON.stringify(query.params),
  )

  const { toggle, pendingIds: pendingFavoriteIds } = useToggleFavorite()
  const { add, pendingIds: pendingCartIds } = useAddToCart()

  const { titleRef, gridRef, focusCatalog, markPageChange, markLoadMore } = useCatalogFocus({
    ready: status === 'ready' && !isPlaceholderData,
    items,
    total,
    page,
    totalPages,
  })

  // Página acima do total (desktop): volta à última página, sem criar entrada no histórico.
  const outOfRange =
    isDesktop &&
    !isPlaceholderData &&
    items?.length === 0 &&
    totalPages !== undefined &&
    totalPages > 0 &&
    page > totalPages

  useEffect(() => {
    if (outOfRange && totalPages !== undefined) setPage(totalPages, { replace: true })
  }, [outOfRange, totalPages, setPage])

  const hasActiveFilters = searchHasActiveFilters(search)
  const activeCount =
    (search.q !== undefined ? 1 : 0) +
    (search.colecao !== undefined ? 1 : 0) +
    (search.rede !== undefined ? 1 : 0) +
    (search.precoMin !== undefined || search.precoMax !== undefined ? 1 : 0)

  const hasMore = items !== undefined && total !== undefined && items.length < total
  const loadingMore = isPlaceholderData

  function onTabChange(next: CatalogTab) {
    setFilters({ aba: next === DEFAULT_TAB ? undefined : next })
  }

  function onSortChange(next: CatalogSort) {
    setFilters({ ordem: next === DEFAULT_SORT ? undefined : next })
  }

  function onCollectionChange(id?: string) {
    setFilters({ colecao: id })
  }

  function onNetworkChange(id?: Network) {
    setFilters({ rede: id })
  }

  function onPriceApply({ min, max }: { min?: number; max?: number }) {
    setFilters({ precoMin: min, precoMax: max })
  }

  function onSearch(query: string) {
    setFilters({ q: query === '' ? undefined : query }, { replace: true })
  }

  function onPageChange(next: number) {
    markPageChange()
    setPage(next)
  }

  function getHref(next: number): string {
    return router.buildLocation({
      to: '/',
      search: { ...search, pagina: next <= 1 ? undefined : next },
    }).href
  }

  function onLoadMore() {
    markLoadMore(items?.length ?? 0)
    setPage(page + 1, { replace: true })
  }

  function onExplore() {
    explore()
    focusCatalog()
  }

  function onAddToCart(nft: NftSummary) {
    add(nft)
  }

  function onToggleFavorite(nft: NftSummary) {
    toggle(nft)
  }

  return {
    isDesktop,
    favoritesMode,
    tab,
    sort,
    page,
    status,
    items,
    busy,
    retrying,
    facets,
    total,
    totalPages,
    updatedIds,
    pendingFavoriteIds,
    pendingCartIds,
    titleRef,
    gridRef,
    hasActiveFilters,
    activeCount,
    hasMore,
    loadingMore,
    onTabChange,
    onSortChange,
    onCollectionChange,
    onNetworkChange,
    onPriceApply,
    onSearch,
    onClearFilters: clearFilters,
    onPageChange,
    getHref,
    onLoadMore,
    onExplore,
    onRetry: () => {
      void refetch()
    },
    onAddToCart,
    onToggleFavorite,
  }
}
