import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { home, nfts } from '@/hooks/queryKeys'
import { onReconnect, subscribeNfts, unsubscribeNfts } from '@/services/realtime/socket'

// Inscreve no socket os NFTs visíveis na grade. Cancela o que saiu e tudo ao desmontar.
export function useNftSubscriptions(ids: readonly string[]): void {
  const queryClient = useQueryClient()
  const subscribedRef = useRef<Set<string>>(new Set())

  // Comparação pelo conteúdo ordenado: a mesma lista com outra referência não reinscreve.
  const idsKey = JSON.stringify([...new Set(ids)].sort())

  useEffect(() => {
    const wanted = new Set<string>(JSON.parse(idsKey) as string[])
    const subscribed = subscribedRef.current

    const added = [...wanted].filter((id) => !subscribed.has(id))
    const removed = [...subscribed].filter((id) => !wanted.has(id))

    if (added.length > 0) {
      subscribeNfts(added)
      for (const id of added) subscribed.add(id)
    }
    if (removed.length > 0) {
      unsubscribeNfts(removed)
      for (const id of removed) subscribed.delete(id)
    }
  }, [idsKey])

  useEffect(() => {
    const subscribed = subscribedRef.current

    return () => {
      const all = [...subscribed]
      subscribed.clear()
      if (all.length > 0) {
        unsubscribeNfts(all)
      }
    }
  }, [])

  useEffect(() => {
    return onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: nfts.lists })
      void queryClient.invalidateQueries({ queryKey: home })
    })
  }, [queryClient])
}
