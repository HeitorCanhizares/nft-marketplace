import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/auth'
import { getCheckoutState } from '@/lib/cartCheckout'
import { clearPending, readPending, setPendingOrderId } from '@/lib/checkoutStorage'
import { orders } from '@/hooks/queryKeys'
import { useCart } from '@/hooks/useCart'
import { createOrder, getPendingOrders } from '@/services/api/orders'

export type CheckoutEntryStatus = 'checking' | 'ready'

// Decide o que fazer ao abrir /pagamento: pedido pendente, reenvio com a chave, carrinho bloqueado ou liberar a tela.
export function useCheckoutEntry() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const pendingQuery = useQuery({
    queryKey: orders.pending,
    queryFn: ({ signal }) => getPendingOrders(signal),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const [status, setStatus] = useState<CheckoutEntryStatus>('checking')

  const userId = user?.id
  const cart = cartQuery.data
  const pendingOrders = pendingQuery.data
  // Com dados em cache (pedido recusado há pouco, carrinho de visitante antes do login), espera a
  // versão nova da lista e do carrinho antes de decidir.
  const isRefreshing = pendingQuery.isFetching || cartQuery.isFetching

  useEffect(() => {
    if (status === 'ready' || !userId || !cart || !pendingOrders || isRefreshing) return

    // Cancelado quando o efeito é refeito ou desmontado: só a execução atual navega.
    let cancelled = false

    async function decide() {
      if (!userId || !cart) return

      const local = readPending(userId)
      const orderId = pendingOrders?.[0]?.id ?? local?.orderId

      // 1. Pedido pendente na lista ou gravado na sessão.
      if (orderId) {
        if (!cancelled) {
          navigate({ to: '/pedido/$orderId', params: { orderId }, replace: true })
        }
        return
      }

      // 2. Chave sem orderId: o envio caiu antes da resposta. Reenvia com a mesma chave e o mesmo corpo.
      if (local && local.orderId === undefined) {
        try {
          const order = await createOrder(local.request, local.key)
          if (cancelled) return
          setPendingOrderId(order.id)
          navigate({ to: '/pedido/$orderId', params: { orderId: order.id }, replace: true })
          return
        } catch {
          if (cancelled) return
          clearPending()
        }
      }

      if (cancelled) return

      // 3. Carrinho que não pode fechar: volta ao carrinho com o motivo.
      const checkoutState = getCheckoutState(cart.items)
      if (!checkoutState.canCheckout) {
        toast.error(checkoutState.reason ?? 'Seu carrinho não pode ser finalizado.')
        navigate({ to: '/carrinho', replace: true })
        return
      }

      // 4. Tela liberada.
      setStatus('ready')
    }

    void decide()

    return () => {
      cancelled = true
    }
  }, [status, userId, cart, pendingOrders, isRefreshing, navigate])

  function retryCart() {
    void cartQuery.refetch()
    void pendingQuery.refetch()
  }

  return {
    status,
    cart,
    isCartError: cartQuery.isError || pendingQuery.isError,
    retryCart,
  }
}
