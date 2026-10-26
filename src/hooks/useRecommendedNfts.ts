import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { useAuth } from '@/contexts/auth'
import { nfts } from '@/hooks/queryKeys'
import { getRecommendedNfts } from '@/services/api/nfts'

const RECOMMENDATIONS_LIMIT = 10

// Recomendações sem os NFTs que já estão em excludeIds. Erro aqui não é throwOnError: não derruba o carrinho.
export function useRecommendedNfts(excludeIds: readonly string[]) {
  const { status } = useAuth()
  const queryClient = useQueryClient()
  const previousStatus = useRef(status)

  useEffect(() => {
    if (previousStatus.current === status) return
    const wasLoading = previousStatus.current === 'loading'
    previousStatus.current = status
    if (wasLoading) return
    void queryClient.invalidateQueries({ queryKey: nfts.recommendations })
  }, [status, queryClient])

  const query = useQuery({
    queryKey: nfts.recommendations,
    queryFn: ({ signal }) => getRecommendedNfts(signal),
    enabled: status !== 'loading',
  })

  // Pelo conteúdo dos ids (ordem e referência do array não importam).
  const excludeKey = [...excludeIds].sort().join('\n')
  const { data } = query

  const visible = useMemo(() => {
    if (data === undefined) return undefined
    const excluded = new Set(excludeKey.split('\n'))
    return data.filter((nft) => !excluded.has(nft.id)).slice(0, RECOMMENDATIONS_LIMIT)
  }, [data, excludeKey])

  return {
    data: visible,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  }
}
