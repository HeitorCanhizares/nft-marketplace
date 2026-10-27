import { Link } from '@tanstack/react-router'
import { CircleXIcon, InfoIcon, Loader2Icon } from 'lucide-react'

import { OrderReceipt } from '@/components/shared/OrderReceipt'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { networkLabel } from '@/lib/walletOptions'
import type { Order } from '@/types/order'

type OrderStatusProps = {
  order: Order
  isSlow: boolean
  variant: 'desktop' | 'mobile'
}

type PanelProps = {
  variant: 'desktop' | 'mobile'
}

// Estado pendente: aguarda a confirmação na rede, com aviso de demora opcional.
function PendingPanel({ order, isSlow, variant }: OrderStatusProps) {
  const isDesktop = variant === 'desktop'

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        isDesktop ? 'px-11 py-12' : 'py-10',
      )}
    >
      <Loader2Icon
        aria-hidden="true"
        className="size-12 animate-spin text-primary motion-reduce:animate-none"
      />
      <h2 className="text-lg font-bold text-foreground">Confirmando pagamento...</h2>
      <p className="text-body text-muted-foreground">
        Aguardando a confirmação na rede {networkLabel(order.network)}. Isso leva só alguns
        instantes.
      </p>
      {isSlow ? (
        <>
          <div className="flex items-start gap-2 rounded-mobile border border-border-strong p-3 text-left text-caption-md text-foreground">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className={cn(isDesktop ? 'h-12 w-[186px] text-base' : 'h-[60px] w-full rounded-full')}
          >
            <Link to="/">Voltar ao início</Link>
          </Button>
        </>
      ) : null}
    </div>
  )
}

// Estado recusado: motivo, itens continuam no carrinho e os dois caminhos de saída.
function DeclinedPanel({ order, variant }: { order: Order } & PanelProps) {
  const isDesktop = variant === 'desktop'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        isDesktop ? 'px-11 py-12' : 'py-10',
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-card text-destructive [&_svg]:size-8"
      >
        <CircleXIcon />
      </div>
      <h2 className="text-lg font-bold text-destructive">Pagamento recusado</h2>
      <p className="text-body text-foreground">
        {order.declineReason ?? 'O pagamento não foi aprovado.'}
      </p>
      <p className="text-body text-muted-foreground">Seus itens continuam no carrinho.</p>
      <div className={cn('mt-2 flex gap-3', isDesktop ? 'flex-row' : 'w-full flex-col')}>
        <Button
          asChild
          variant={isDesktop ? 'default' : 'gradient'}
          className={cn(isDesktop ? 'h-12 w-[186px] text-base' : 'h-[60px] w-full rounded-full')}
        >
          <Link to="/pagamento">Tentar novamente</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className={cn(isDesktop ? 'h-12 w-[186px] text-base' : 'h-[60px] w-full rounded-full')}
        >
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </div>
    </div>
  )
}

// Conteúdo por estado. O recibo só aparece com status confirmado.
export function OrderStatus({ order, isSlow, variant }: OrderStatusProps) {
  switch (order.status) {
    case 'pending':
      return <PendingPanel order={order} isSlow={isSlow} variant={variant} />
    case 'confirmed':
      return <OrderReceipt order={order} variant={variant} />
    case 'declined':
      return <DeclinedPanel order={order} variant={variant} />
  }
}
