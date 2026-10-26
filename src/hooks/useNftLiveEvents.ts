import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { nfts } from '@/hooks/queryKeys'
import { onSocketEvent } from '@/services/realtime/socket'
import type { CatalogResponse } from '@/types/catalog'

// Aplica os eventos de preço e estoque no cache das listas, sem mudar a ordem da grade.
export function useNftLiveEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const offPriceChanged = onSocketEvent('nft:price_changed', (payload) => {
      const lists = queryClient.getQueriesData<CatalogResponse>({ queryKey: nfts.lists })

      for (const [key, data] of lists) {
        const item = data?.items.find((candidate) => candidate.id === payload.nftId)
        if (!item) continue

        if (item.defaultEditionId === payload.editionId) {
          // Edição exibida: troca só este item, na mesma posição.
          queryClient.setQueryData<CatalogResponse>(
            key,
            (old) =>
              old && {
                ...old,
                items: old.items.map((current) =>
                  current.id === payload.nftId
                    ? { ...current, price: payload.price, previousPrice: payload.previousPrice }
                    : current,
                ),
              },
          )
        } else {
          // Outra edição: o preço exibido pode ter mudado, e o front não calcula valores.
          void queryClient.invalidateQueries({ queryKey: key })
        }
      }
    })

    const offStockChanged = onSocketEvent('nft:stock_changed', (payload) => {
      const lists = queryClient.getQueriesData<CatalogResponse>({ queryKey: nfts.lists })

      for (const [key, data] of lists) {
        if (data?.items.some((candidate) => candidate.id === payload.nftId)) {
          void queryClient.invalidateQueries({ queryKey: key })
        }
      }
    })

    return () => {
      offPriceChanged()
      offStockChanged()
    }
  }, [queryClient])
}
