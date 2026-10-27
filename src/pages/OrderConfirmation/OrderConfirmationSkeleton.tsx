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

// Mesmos blocos do recibo, com as mesmas alturas e margens: sem salto de layout ao trocar pelo conteúdo.
function SkeletonBlocks({ isDesktop }: SkeletonBlocksProps) {
  return (
    <div role="status" aria-busy="true" className="flex w-full flex-col">
      <span className="sr-only">Carregando pedido…</span>

      <div className={cn('flex flex-col items-center', isDesktop ? 'mt-[22px]' : 'mt-0')}>
        <Skeleton className="h-20 w-[66px]" />
        <div className="mt-3 flex h-6 items-center">
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <Skeleton
        className={cn(
          isDesktop ? '-mx-11 mt-[18px] h-[67px]' : 'mt-4 h-[136px] w-full rounded-card',
        )}
      />

      <div
        className={cn('flex items-center', isDesktop ? 'mt-[18px] h-[21.4px]' : 'mt-6 h-[22.5px]')}
      >
        <Skeleton className="h-4 w-44" />
      </div>

      <div className={isDesktop ? 'mt-1.5' : 'mt-3'}>
        <div className={cn('flex items-start', isDesktop ? 'h-[30.4px]' : 'h-[31.5px]')}>
          <Skeleton className="h-4 w-24" />
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {Array.from({ length: RECEIPT_ITEM_COUNT }, (_, index) => (
            <LineItemSkeleton key={index} variant="receipt" />
          ))}
        </ul>
      </div>

      <div
        className={cn(
          'flex flex-col justify-start gap-3',
          isDesktop ? 'mt-2 h-[77px] pt-1.5' : 'mt-6 h-[83px] pt-1.5',
        )}
      >
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div
        className={cn(
          'flex flex-col items-center gap-2 pt-1',
          isDesktop ? 'h-[64.3px]' : 'h-[60px]',
        )}
      >
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className={cn('flex flex-col items-center', isDesktop ? 'mt-5' : 'mt-[26px]')}>
        {isDesktop ? (
          <Skeleton className="h-12 w-[186px]" />
        ) : (
          <Skeleton className="h-15 w-full rounded-full" />
        )}
        <div className="mt-2 h-[17px]" />
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
