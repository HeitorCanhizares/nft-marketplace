import { Skeleton } from '@/components/ui/skeleton'
import type { LineItemVariant } from '@/components/shared/LineItem'

type LineItemSkeletonProps = {
  variant: LineItemVariant
}

// Mesmo formato da linha: tabela no desktop (`cart-row`), card na lista mobile (`cart-card`).
export function LineItemSkeleton({ variant }: LineItemSkeletonProps) {
  if (variant === 'cart-row') {
    return (
      <tr aria-hidden="true" className="bg-card">
        <td className="py-0 pr-3 pl-0">
          <div className="flex items-center gap-4">
            <Skeleton className="size-[70px] shrink-0 rounded-media" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </td>
        <td className="px-3 py-0">
          <Skeleton className="h-4 w-20" />
        </td>
        <td className="px-3 py-0">
          <Skeleton className="h-7 w-24" />
        </td>
        <td className="px-3 py-0">
          <Skeleton className="h-4 w-20" />
        </td>
        <td className="py-0 pr-3 pl-3">
          <Skeleton className="size-11 rounded-full" />
        </td>
      </tr>
    )
  }

  return (
    <li aria-hidden="true" className="flex gap-3 rounded-card bg-card p-3">
      <Skeleton className="size-[70px] shrink-0 rounded-media" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>
    </li>
  )
}
