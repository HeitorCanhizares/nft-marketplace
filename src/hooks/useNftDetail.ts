import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useAuth } from '@/contexts/auth'
import { nfts } from '@/hooks/queryKeys'
import { getNft, getRelatedNfts } from '@/services/api/nfts'

export function nftDetailOptions(id: string) {
  return queryOptions({
    queryKey: nfts.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })
}

// O detalhe carrega `isFavorite` por usuário: só lê depois da inicialização da sessão e relê ao entrar ou sair.
export function useNftDetail(id: string) {
  const { status } = useAuth()
  const queryClient = useQueryClient()
  const previousStatus = useRef(status)

  useEffect(() => {
    if (previousStatus.current === status) return
    const wasLoading = previousStatus.current === 'loading'
    previousStatus.current = status
    if (wasLoading) return
    void queryClient.invalidateQueries({ queryKey: nfts.detail(id) })
  }, [status, id, queryClient])

  return useQuery({
    ...nftDetailOptions(id),
    enabled: status !== 'loading',
  })
}

export function useRelatedNfts(id: string) {
  return useQuery({
    queryKey: nfts.related(id),
    queryFn: ({ signal }) => getRelatedNfts(id, signal),
  })
}
