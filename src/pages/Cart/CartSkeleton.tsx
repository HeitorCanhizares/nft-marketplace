import { LineItemSkeleton } from '@/components/shared/LineItemSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROWS = 3

type CartSkeletonProps = {
  variant: 'desktop' | 'mobile'
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Carregando o carrinho: linhas e resumo no mesmo layout de cada tela.
export function CartSkeleton({ variant }: CartSkeletonProps) {
  const rows = Array.from({ length: SKELETON_ROWS }, (_, index) => index)

  if (variant === 'desktop') {
    return (
      <div aria-busy="true" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-22">
        <table className="w-full border-separate border-spacing-y-2 text-left">
          <caption className="sr-only">Carregando o carrinho</caption>
          <tbody>
            {rows.map((row) => (
              <LineItemSkeleton key={row} variant="cart-row" />
            ))}
          </tbody>
        </table>
        <SummarySkeleton />
      </div>
    )
  }

  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-4 pb-4">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <LineItemSkeleton key={row} variant="cart-card" />
        ))}
      </ul>
      <SummarySkeleton />
    </div>
  )
}
