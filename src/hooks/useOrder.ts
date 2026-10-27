import { queryOptions, useQuery } from '@tanstack/react-query'

import { orders } from '@/hooks/queryKeys'
import { useSocketConnected } from '@/hooks/useSocketConnected'
import { getOrder } from '@/services/api/orders'

export const ORDER_POLL_MS = 2000

export function orderOptions(orderId: string) {
  return queryOptions({
    queryKey: orders.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    staleTime: 0,
  })
}

// Com o socket conectado, quem atualiza é o order:updated. Polling só com pedido pendente e socket fora.
export function useOrder(orderId: string) {
  const socketConnected = useSocketConnected()

  return useQuery({
    ...orderOptions(orderId),
    refetchOnMount: 'always',
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !socketConnected ? ORDER_POLL_MS : false,
  })
}
