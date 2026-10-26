import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type PromoCardSkeletonProps = {
  className?: string
}

export function PromoCardSkeleton({ className }: PromoCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        'grid h-62.5 grid-cols-[287px_1fr] overflow-hidden rounded-lg bg-card',
        className,
      )}
    >
      <span className="sr-only">Carregando promoção…</span>
      <Skeleton className="h-full w-full rounded-panel" />
      <div className="flex flex-col items-end justify-center gap-3 py-6 pr-7.5 pl-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-35" />
      </div>
    </div>
  )
}
