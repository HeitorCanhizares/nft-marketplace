import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type FeaturedNftCardSkeletonProps = {
  className?: string
}

export function FeaturedNftCardSkeleton({ className }: FeaturedNftCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('flex h-117.25 w-full flex-col bg-card', className)}
    >
      <span className="sr-only">Carregando destaque…</span>
      <div className="flex h-26 flex-col items-stretch gap-3 px-5 pt-7">
        <Skeleton className="h-6 w-48 self-start" />
        <Skeleton className="mx-auto h-6 w-40" />
      </div>
      <Skeleton className="h-91.5 w-full rounded-panel" />
    </div>
  )
}
