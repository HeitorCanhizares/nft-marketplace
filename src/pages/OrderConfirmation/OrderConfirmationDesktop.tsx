import { OrderDialog } from '@/components/shared/OrderDialog'
import { OrderStatus } from '@/components/shared/OrderStatus'
import { orderTitle, type OrderViewProps } from '@/pages/OrderConfirmation/viewProps'

// Tela desktop da Confirmação: o pedido num modal centralizado sobre fundo opaco. O fundo não monta
// o Pagamento; a página decide o destino ao fechar (onClose).
export function OrderConfirmationDesktop({ order, isSlow, onClose }: OrderViewProps) {
  return (
    <OrderDialog title={orderTitle(order.status)} onClose={onClose}>
      <OrderStatus order={order} isSlow={isSlow} variant="desktop" />
    </OrderDialog>
  )
}
