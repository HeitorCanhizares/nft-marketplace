import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth'
import { favorites, home, nfts } from '@/hooks/queryKeys'
import { savePendingAction } from '@/lib/pendingAction'
import { addFavorite, removeFavorite } from '@/services/api/favorites'
import type { CatalogResponse } from '@/types/catalog'
import type { HomeResponse, NftSummary } from '@/types/nft'

type ToggleVars = { nft: NftSummary; next: boolean }

type Snapshot = {
  lists: [QueryKey, CatalogResponse | undefined][]
  home: [QueryKey, HomeResponse | undefined][]
}

function withFavorite(item: NftSummary, nftId: string, isFavorite: boolean): NftSummary {
  return item.id === nftId ? { ...item, isFavorite } : item
}

// Favoritar pelo card: atualização otimista; desfaz e avisa em caso de erro.
export function useToggleFavorite() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())

  const mutation = useMutation<void, Error, ToggleVars, Snapshot>({
    mutationFn: ({ nft, next }) => (next ? addFavorite(nft.id) : removeFavorite(nft.id)),
    onMutate: async ({ nft, next }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: nfts.lists }),
        queryClient.cancelQueries({ queryKey: home }),
      ])

      const snapshot: Snapshot = {
        lists: queryClient.getQueriesData<CatalogResponse>({ queryKey: nfts.lists }),
        home: queryClient.getQueriesData<HomeResponse>({ queryKey: home }),
      }

      queryClient.setQueriesData<CatalogResponse>(
        { queryKey: nfts.lists },
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) => withFavorite(item, nft.id, next)),
          },
      )
      queryClient.setQueriesData<HomeResponse>(
        { queryKey: home },
        (old) =>
          old && {
            ...old,
            hero: old.hero.map((item) => withFavorite(item, nft.id, next)),
            featured: withFavorite(old.featured, nft.id, next),
          },
      )

      setPendingIds((prev) => new Set(prev).add(nft.id))
      return snapshot
    },
    onError: (_error, { nft, next }, snapshot) => {
      if (snapshot) {
        for (const [key, data] of snapshot.lists) queryClient.setQueryData(key, data)
        for (const [key, data] of snapshot.home) queryClient.setQueryData(key, data)
      }
      toast.error(
        `Não foi possível ${next ? 'favoritar' : 'remover dos favoritos'} ${nft.name}. Tente de novo.`,
      )
    },
    onSuccess: (_data, { nft, next }) => {
      toast.success(
        next ? `${nft.name} adicionado aos favoritos` : `${nft.name} removido dos favoritos`,
      )
    },
    onSettled: (_data, _error, { nft }) => {
      setPendingIds((prev) => {
        const remaining = new Set(prev)
        remaining.delete(nft.id)
        return remaining
      })
      void queryClient.invalidateQueries({ queryKey: favorites })
    },
  })

  function toggle(nft: NftSummary): void {
    if (status === 'loading') return

    if (status === 'anonymous') {
      savePendingAction({ type: 'favorite', nftId: nft.id })
      void navigate({ to: '/entrar', search: { redirect: router.state.location.href } })
      return
    }

    if (pendingIds.has(nft.id)) return
    mutation.mutate({ nft, next: nft.isFavorite !== true })
  }

  return { toggle, pendingIds }
}
