import type { Order, OrderStatus } from '@/types/order'

export type OrderViewProps = { order: Order; isSlow: boolean; onClose: () => void }

export function orderTitle(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Confirmando pagamento'
    case 'confirmed':
      return 'Pedido confirmado'
    case 'declined':
      return 'Pagamento recusado'
  }
}
