import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, nfts } from '@/hooks/queryKeys'
import { useNftSubscriptions } from '@/hooks/useNftSubscriptions'
import { formatEthSpoken } from '@/lib/formatEth'
import { onReconnect, onSocketEvent } from '@/services/realtime/socket'
import type { NftDetail } from '@/types/nft'

const UPDATED_MS = 5000

// Tempo real do NFT aberto: preço e estoque das edições. Eventos de outros NFTs são ignorados.
export function useNftDetailLive(nft: NftDetail): { updatedEditionId: string | null } {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()
  const [updatedEditionId, setUpdatedEditionId] = useState<string | null>(null)
  const updatedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useNftSubscriptions([nft.id])

  useEffect(() => {
    return onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: nfts.detail(nft.id) })
      void queryClient.invalidateQueries({ queryKey: cart })
    })
  }, [queryClient, nft.id])

  useEffect(() => {
    const offPrice = onSocketEvent('nft:price_changed', (payload) => {
      if (payload.nftId !== nft.id) return

      queryClient.setQueryData<NftDetail>(
        nfts.detail(nft.id),
        (old) =>
          old && {
            ...old,
            editions: old.editions.map((edition) =>
              edition.id === payload.editionId ? { ...edition, price: payload.price } : edition,
            ),
          },
      )
      void queryClient.invalidateQueries({ queryKey: nfts.detail(nft.id) })
      void queryClient.invalidateQueries({ queryKey: cart })

      setUpdatedEditionId(payload.editionId)
      if (updatedTimer.current !== null) clearTimeout(updatedTimer.current)
      updatedTimer.current = setTimeout(() => {
        updatedTimer.current = null
        setUpdatedEditionId(null)
      }, UPDATED_MS)

      const label =
        nft.editions.find((edition) => edition.id === payload.editionId)?.label ?? payload.editionId
      announce(
        `O preço da edição ${label} de ${nft.name} mudou para ${formatEthSpoken(payload.price)}`,
        'polite',
      )
    })

    // Não anuncia aqui: o ajuste de quantidade é do useNftPurchase.
    const offStock = onSocketEvent('nft:stock_changed', (payload) => {
      if (payload.nftId !== nft.id) return

      queryClient.setQueryData<NftDetail>(
        nfts.detail(nft.id),
        (old) =>
          old && {
            ...old,
            editions: old.editions.map((edition) =>
              edition.id === payload.editionId
                ? { ...edition, available: payload.available }
                : edition,
            ),
          },
      )
      void queryClient.invalidateQueries({ queryKey: nfts.detail(nft.id) })
      void queryClient.invalidateQueries({ queryKey: cart })
    })

    return () => {
      offPrice()
      offStock()
    }
  }, [nft, queryClient, announce])

  useEffect(() => {
    return () => {
      if (updatedTimer.current !== null) clearTimeout(updatedTimer.current)
      updatedTimer.current = null
    }
  }, [])

  return { updatedEditionId }
}
