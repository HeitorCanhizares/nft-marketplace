import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, orders, quoteAll } from '@/hooks/queryKeys'
import { clearDraft, clearPending, readPending } from '@/lib/checkoutStorage'
import type { Order, OrderStatus } from '@/types/order'

export const SLOW_AFTER_MS = 60_000

const DEFAULT_DECLINE_MESSAGE = 'O pagamento não foi aprovado.'

type Seen = { orderId: string | undefined; status: OrderStatus | undefined }

// Desfecho do pedido: anúncio, limpeza do checkout guardado, cache e aviso de demora.
export function useOrderOutcome(
  order: Order | undefined,
  userId: string | undefined,
): { isSlow: boolean } {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()

  const orderId = order?.id
  const status = order?.status
  const declineReason = order?.declineReason
  const createdAt = order?.createdAt
  const isPending = status === 'pending'

  // Refs lidas e escritas só dentro de efeitos.
  const previous = useRef<Seen>({ orderId: undefined, status: undefined })
  const [slowFlag, setSlowFlag] = useState(false)

  useEffect(() => {
    const before = previous.current
    previous.current = { orderId, status }

    if (orderId === undefined || status === undefined || status === 'pending') return

    // Só conta como transição se a mudança foi vista nesta página, no mesmo pedido.
    const transitioned = before.orderId === orderId && before.status === 'pending'

    const stored = userId ? readPending(userId) : null
    let cleaned = false
    if (stored?.orderId === orderId) {
      if (status === 'confirmed') {
        clearPending()
        clearDraft()
        cleaned = true
      } else {
        // Recusado: o rascunho fica para "Tentar novamente" voltar ao Pagamento preenchido.
        clearPending()
        cleaned = true
      }
    }

    if (transitioned || cleaned) {
      void queryClient.invalidateQueries({ queryKey: orders.pending })
      if (status === 'confirmed') {
        void queryClient.invalidateQueries({ queryKey: cart })
        void queryClient.invalidateQueries({ queryKey: quoteAll })
      }
    }

    if (transitioned) {
      if (status === 'confirmed') {
        announce('Pedido confirmado', 'assertive')
      } else {
        const reason = declineReason || DEFAULT_DECLINE_MESSAGE
        announce(`Pagamento recusado. ${reason}`, 'assertive')
      }
    }
  }, [orderId, status, declineReason, userId, queryClient, announce])

  useEffect(() => {
    if (!isPending || createdAt === undefined) return

    // Prazo conta desde a criação do pedido; sempre por timer, mesmo com tempo 0.
    const remaining = Math.max(0, Date.parse(createdAt) + SLOW_AFTER_MS - Date.now())
    const timer = setTimeout(() => {
      setSlowFlag(true)
    }, remaining)

    return () => {
      clearTimeout(timer)
      setSlowFlag(false)
    }
  }, [isPending, createdAt])

  return { isSlow: isPending && slowFlag }
}
