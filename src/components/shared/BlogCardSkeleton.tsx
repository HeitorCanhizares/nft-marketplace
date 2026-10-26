import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type BlogCardSkeletonProps = {
  className?: string
}

export function BlogCardSkeleton({ className }: BlogCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('flex flex-col overflow-hidden rounded-media bg-card', className)}
    >
      <span className="sr-only">Carregando post…</span>
      <Skeleton className="h-48.75 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
