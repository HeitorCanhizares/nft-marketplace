import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'

import { nfts } from '@/hooks/queryKeys'
import { getReviews } from '@/services/api/nfts'
import type { Review } from '@/types/nft'

export type ReviewsState = {
  items: Review[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  isLoadingMore: boolean
  loadMore: () => void
  retry: () => void
}

// Avaliações em páginas acumuladas: cada página é uma query própria, na ordem da lista.
export function useReviews(nftId: string, enabled: boolean): ReviewsState {
  const [pages, setPages] = useState(1)

  const results = useQueries({
    queries: Array.from({ length: pages }, (_, index) => {
      const page = index + 1
      return {
        queryKey: nfts.reviews(nftId, page),
        queryFn: ({ signal }: { signal: AbortSignal }) => getReviews(nftId, page, signal),
        enabled,
      }
    }),
  })

  const first = results[0]
  const last = results[results.length - 1]
  const lastData = last.data
  const isLoadingMore = pages > 1 && last.isFetching

  function loadMore(): void {
    if (isLoadingMore || lastData === undefined || lastData.page >= lastData.totalPages) return
    setPages((current) => current + 1)
  }

  function retry(): void {
    for (const result of results) void result.refetch()
  }

  return {
    items: results.flatMap((result) => result.data?.items ?? []),
    total: first.data?.total ?? 0,
    hasMore: lastData !== undefined && lastData.page < lastData.totalPages,
    isLoading: first.isPending,
    isError: results.some((result) => result.isError),
    isLoadingMore,
    loadMore,
    retry,
  }
}
