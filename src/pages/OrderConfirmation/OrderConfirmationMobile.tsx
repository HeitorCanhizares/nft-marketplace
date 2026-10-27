import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { OrderStatus } from '@/components/shared/OrderStatus'

import type { OrderViewProps } from './viewProps'

// Mobile: o pedido vira página cheia com a barra "Pedido". O voltar vai para a Início, não para o
// histórico. O recibo continua acessível pela URL. onClose não é usado aqui.
export function OrderConfirmationMobile({ order, isSlow }: OrderViewProps) {
  return (
    <div className="flex flex-col pb-8">
      <MobileTopBar title="Pedido" backTo={{ to: '/' }} />
      <div className="px-7">
        <OrderStatus order={order} isSlow={isSlow} variant="mobile" />
      </div>
    </div>
  )
}
