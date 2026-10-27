import { useNavigate } from '@tanstack/react-router'

import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { LineItemSkeleton } from '@/components/shared/LineItemSkeleton'
import { OrderDialog } from '@/components/shared/OrderDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

const RECEIPT_ITEM_COUNT = 3

type SkeletonBlocksProps = {
  isDesktop: boolean
}

// Mesmos blocos do recibo, nas mesmas medidas: sem salto de layout ao trocar pelo conteúdo.
function SkeletonBlocks({ isDesktop }: SkeletonBlocksProps) {
  return (
    <div role="status" aria-busy="true" className="flex w-full flex-col">
      <span className="sr-only">Carregando pedido…</span>

      <div className={cn('flex flex-col items-center', isDesktop ? 'mt-[22px]' : 'mt-0')}>
        <Skeleton className="h-20 w-[66px]" />
        <Skeleton className="mt-[18px] h-4 w-56" />
      </div>

      <Skeleton
        className={cn('h-[65px]', isDesktop ? '-mx-11 mt-[22px]' : 'mt-4 w-full rounded-card')}
      />

      <Skeleton className={cn('h-4 w-44', isDesktop ? 'mt-[22px]' : 'mt-6')} />

      <ul className="mt-3 flex flex-col gap-3">
        {Array.from({ length: RECEIPT_ITEM_COUNT }, (_, index) => (
          <LineItemSkeleton key={index} variant="receipt" />
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className={cn('flex justify-center', isDesktop ? 'mt-[26px]' : 'mt-6')}>
        {isDesktop ? (
          <Skeleton className="h-12 w-[186px]" />
        ) : (
          <Skeleton className="h-15 w-full rounded-full" />
        )}
      </div>
    </div>
  )
}

// Esqueleto da Confirmação enquanto carrega. Desktop: modal com a mesma moldura do recibo. Mobile:
// página cheia com a mesma barra "Pedido" e 358 px de conteúdo.
export function OrderConfirmationSkeleton() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()

  if (isDesktop) {
    return (
      <OrderDialog title="Carregando pedido" onClose={() => navigate({ to: '/' })}>
        <div className="px-11 pb-12">
          <SkeletonBlocks isDesktop />
        </div>
      </OrderDialog>
    )
  }

  return (
    <div className="flex flex-col pb-8">
      <MobileTopBar title="Pedido" backTo={{ to: '/' }} />
      <div className="px-7">
        <SkeletonBlocks isDesktop={false} />
      </div>
    </div>
  )
}
