import { Skeleton } from '@/components/ui/skeleton'

const FIELD_COUNT = 10

// Desktop: formulário em grade de 369 + 370 px (campo de 40 px, passo de 81 px) e coluna de 405 px.
function DesktopSkeleton() {
  return (
    <div className="flex w-full flex-wrap items-start gap-10">
      <div className="grid grid-cols-[369px_370px]">
        {Array.from({ length: FIELD_COUNT }, (_, index) => (
          <div key={index} className="flex flex-col gap-[25px]">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <div className="flex w-[405px] max-w-full flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[220px] w-full rounded-card" />
        <Skeleton className="h-[160px] w-full rounded-card" />
      </div>
    </div>
  )
}

// Mobile: dois cartões de carteira salva (93 px), três de provedor (65 px) e o botão (60 px).
function MobileSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col px-7 pt-8 pb-8">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[93px] w-full rounded-mobile" />
        <Skeleton className="h-[93px] w-full rounded-mobile" />
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <Skeleton className="h-[65px] w-full rounded-mobile" />
        <Skeleton className="h-[65px] w-full rounded-mobile" />
        <Skeleton className="h-[65px] w-full rounded-mobile" />
      </div>

      <Skeleton className="mt-auto h-15 w-full rounded-full" />
    </div>
  )
}

type CheckoutSkeletonProps = {
  variant: 'desktop' | 'mobile'
}

// Esqueleto do Pagamento enquanto carrega, no mesmo layout de cada tela.
export function CheckoutSkeleton({ variant }: CheckoutSkeletonProps) {
  return (
    <div role="status" aria-busy="true" className="flex w-full flex-col">
      <span className="sr-only">Carregando pagamento…</span>
      {variant === 'desktop' ? <DesktopSkeleton /> : <MobileSkeleton />}
    </div>
  )
}
