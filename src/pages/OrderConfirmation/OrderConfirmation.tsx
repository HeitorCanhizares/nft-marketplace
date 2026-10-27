import { Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { BreadcrumbEntry } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useOrder } from '@/hooks/useOrder'
import { useOrderLive } from '@/hooks/useOrderLive'
import { useOrderOutcome } from '@/hooks/useOrderOutcome'
import { OrderConfirmationDesktop } from '@/pages/OrderConfirmation/OrderConfirmationDesktop'
import { OrderConfirmationMobile } from '@/pages/OrderConfirmation/OrderConfirmationMobile'
import { OrderConfirmationSkeleton } from '@/pages/OrderConfirmation/OrderConfirmationSkeleton'
import type { OrderViewProps } from '@/pages/OrderConfirmation/viewProps'

// 'ok' = pedido carregado pelo loader; os outros dois são os estados de acesso sem diálogo.
export type OrderAccess = 'ok' | 'forbidden' | 'not-found'

type OrderConfirmationProps = {
  orderId: string
  access: OrderAccess
}

const BREADCRUMB: BreadcrumbEntry[] = [{ label: 'Início', link: { to: '/' } }, { label: 'Pedido' }]

const ACCESS_COPY: Record<Exclude<OrderAccess, 'ok'>, { title: string; description: string }> = {
  forbidden: {
    title: 'Você não tem acesso a este pedido',
    description: 'Este pedido pertence a outra conta.',
  },
  'not-found': {
    title: 'Pedido não encontrado',
    description: 'O pedido que você procura não existe ou foi removido.',
  },
}

function OrderFrame({ isDesktop, children }: { isDesktop: boolean; children: ReactNode }) {
  return (
    <div className={isDesktop ? 'container-page flex flex-col pb-16' : 'flex flex-col pb-8'}>
      {children}
    </div>
  )
}

// Página da Confirmação: decide entre estado de acesso, carregamento, erro e a tela da largura atual.
export function OrderConfirmation({ orderId, access }: OrderConfirmationProps) {
  const isDesktop = useIsDesktop()

  if (access !== 'ok') {
    const copy = ACCESS_COPY[access]
    return (
      <OrderFrame isDesktop={isDesktop}>
        <PageHeader
          title="Pedido"
          isDesktop={isDesktop}
          breadcrumb={BREADCRUMB}
          backTo={{ to: '/' }}
        />
        <EmptyState
          as="h2"
          title={copy.title}
          description={copy.description}
          action={
            <Button asChild>
              <Link to="/">Voltar para o início</Link>
            </Button>
          }
        />
      </OrderFrame>
    )
  }

  // A key zera o estado dos hooks quando o parâmetro muda.
  return <OrderConfirmationContent key={orderId} orderId={orderId} />
}

// Componente interno: liga os hooks do pedido às telas. Só existe com acesso liberado pelo loader.
function OrderConfirmationContent({ orderId }: { orderId: string }) {
  const isDesktop = useIsDesktop()
  const { user } = useAuth()
  const navigate = useNavigate()
  const query = useOrder(orderId)
  const order = query.data
  useOrderLive(orderId, order?.status)
  const { isSlow } = useOrderOutcome(order, user?.id)

  if (order === undefined) {
    if (query.isError) {
      return (
        <OrderFrame isDesktop={isDesktop}>
          <PageHeader
            title="Pedido"
            isDesktop={isDesktop}
            breadcrumb={BREADCRUMB}
            backTo={{ to: '/' }}
          />
          <ErrorState
            onRetry={() => {
              void query.refetch()
            }}
            retrying={query.isFetching}
          />
        </OrderFrame>
      )
    }
    return <OrderConfirmationSkeleton />
  }

  const viewProps: OrderViewProps = {
    order,
    isSlow,
    onClose: () => {
      void navigate({ to: '/' })
    },
  }

  return isDesktop ? (
    <OrderConfirmationDesktop {...viewProps} />
  ) : (
    <OrderConfirmationMobile {...viewProps} />
  )
}
