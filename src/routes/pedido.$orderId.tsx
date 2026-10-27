import { createFileRoute } from '@tanstack/react-router'

import { queryClient } from '@/app/queryClient'
import { requireAuth } from '@/app/routeGuards'
import { orderOptions } from '@/hooks/useOrder'
import { OrderConfirmation, type OrderAccess } from '@/pages/OrderConfirmation/OrderConfirmation'
import { OrderConfirmationSkeleton } from '@/pages/OrderConfirmation/OrderConfirmationSkeleton'
import { isApiError } from '@/services/http/ApiError'

type OrderLoaderData = { access: OrderAccess; documentTitle: string }

export const Route = createFileRoute('/pedido/$orderId')({
  staticData: { title: 'Pedido' },
  beforeLoad: requireAuth,
  loader: async ({ params }): Promise<OrderLoaderData> => {
    try {
      // staleTime 0: sempre busca o servidor, o cache de uma visita antiga não vale.
      await queryClient.fetchQuery(orderOptions(params.orderId))
      return { access: 'ok', documentTitle: 'Pedido' }
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        return { access: 'forbidden', documentTitle: 'Acesso negado' }
      }
      if (isApiError(error) && error.status === 404) {
        return { access: 'not-found', documentTitle: 'Pedido não encontrado' }
      }
      throw error
    }
  },
  pendingComponent: OrderConfirmationSkeleton,
  pendingMs: 200,
  component: OrderConfirmationRoute,
})

function OrderConfirmationRoute() {
  const { orderId } = Route.useParams()
  const { access } = Route.useLoaderData()
  return <OrderConfirmation orderId={orderId} access={access} />
}
