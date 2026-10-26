import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type NftCardSkeletonProps = {
  className?: string
}

export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <div className={cn(className)}>
      <div className="flex aspect-[43/50] items-center justify-center bg-card max-lg:aspect-[7/8] max-lg:rounded-card">
        <Skeleton className="aspect-square w-[calc(100%-0.5rem)] rounded-media" />
      </div>
      <div className="max-lg:px-2">
        <Skeleton className="mt-3 h-4 w-3/4" />
        <Skeleton className="mt-2 h-5 w-1/3" />
      </div>
    </div>
  )
}
