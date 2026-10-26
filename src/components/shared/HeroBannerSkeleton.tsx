import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type HeroBannerSkeletonProps = {
  variant: 'desktop' | 'mobile'
  className?: string
}

export function HeroBannerSkeleton({ variant, className }: HeroBannerSkeletonProps) {
  const isDesktop = variant === 'desktop'

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('relative w-full', isDesktop ? 'h-112.5' : 'h-47.5 rounded-panel', className)}
    >
      <span className="sr-only">Carregando destaques…</span>

      {isDesktop ? (
        <>
          <div className="absolute top-11.25 left-10 flex w-136 flex-col gap-8">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-35 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="mt-2 h-10 w-35" />
          </div>
          <Skeleton className="absolute top-0 right-0 size-112.5 rounded-panel" />
        </>
      ) : (
        <>
          <div className="absolute top-2 left-4 flex w-47 flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="absolute top-2.5 right-3.75 size-34.5 rounded-media" />
        </>
      )}
    </div>
  )
}
