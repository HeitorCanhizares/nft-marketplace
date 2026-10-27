import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { orders } from '@/hooks/queryKeys'
import { onSocketConnection, onSocketEvent, subscribeOrder } from '@/services/realtime/socket'
import type { OrderStatus } from '@/types/order'

// Tempo real do pedido pendente. O payload de order:updated só dispara releitura do GET.
export function useOrderLive(orderId: string, status: OrderStatus | undefined): void {
  const queryClient = useQueryClient()
  const isPending = status === 'pending'

  useEffect(() => {
    if (!isPending) return
    subscribeOrder(orderId)
  }, [isPending, orderId])

  useEffect(() => {
    if (!isPending) return

    return onSocketEvent('order:updated', (payload) => {
      if (payload.orderId !== orderId) return
      void queryClient.invalidateQueries({ queryKey: orders.detail(orderId) })
      void queryClient.invalidateQueries({ queryKey: orders.pending })
    })
  }, [isPending, orderId, queryClient])

  useEffect(() => {
    if (!isPending) return

    // Cobre a primeira conexão da página e toda reconexão; o socket reenvia a inscrição antes.
    return onSocketConnection((connected) => {
      if (connected) {
        void queryClient.invalidateQueries({ queryKey: orders.detail(orderId) })
      }
    })
  }, [isPending, orderId, queryClient])
}
