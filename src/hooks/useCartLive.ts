import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, quoteAll } from '@/hooks/queryKeys'
import { useNftSubscriptions } from '@/hooks/useNftSubscriptions'
import { formatEthSpoken } from '@/lib/formatEth'
import { onReconnect, onSocketEvent } from '@/services/realtime/socket'
import type { Cart } from '@/types/cart'

// Avisos de preço e estoque que chegam juntos viram uma só fala.
const ANNOUNCE_WINDOW_MS = 1000

// Tempo real do carrinho: preço e estoque dos NFTs das linhas. Nunca mexe no foco nem remove linhas.
export function useCartLive(cartData: Cart | undefined): void {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()
  const pendingMessages = useRef<string[]>([])
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useNftSubscriptions(cartData?.items.map((line) => line.nft.id) ?? [])

  useEffect(() => {
    return onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: cart })
      void queryClient.invalidateQueries({ queryKey: quoteAll })
    })
  }, [queryClient])

  useEffect(() => {
    function queue(message: string): void {
      pendingMessages.current.push(message)
      if (announceTimer.current !== null) return

      announceTimer.current = setTimeout(() => {
        announceTimer.current = null
        const messages = pendingMessages.current
        pendingMessages.current = []
        announce(messages.join('. '), 'polite')
      }, ANNOUNCE_WINDOW_MS)
    }

    // Lê o carrinho do cache: NFT que não está no carrinho é ignorado.
    function lineFor(nftId: string) {
      const current = queryClient.getQueryData<Cart>(cart)
      return current?.items.find((line) => line.nft.id === nftId)
    }

    function refresh(): void {
      void queryClient.invalidateQueries({ queryKey: cart })
      void queryClient.invalidateQueries({ queryKey: quoteAll })
    }

    const offPrice = onSocketEvent('nft:price_changed', (payload) => {
      const line = lineFor(payload.nftId)
      if (line === undefined) return

      refresh()
      queue(`O preço de ${line.nft.name} mudou para ${formatEthSpoken(payload.price)}`)
    })

    const offStock = onSocketEvent('nft:stock_changed', (payload) => {
      const line = lineFor(payload.nftId)
      if (line === undefined) return

      refresh()
      if (payload.available === 0) {
        queue(`${line.nft.name} esgotou`)
      } else if (payload.available !== null) {
        queue(`Restam ${payload.available} de ${line.nft.name}`)
      }
    })

    return () => {
      offPrice()
      offStock()
    }
  }, [queryClient, announce])

  useEffect(() => {
    return () => {
      if (announceTimer.current !== null) clearTimeout(announceTimer.current)
      announceTimer.current = null
    }
  }, [])
}
