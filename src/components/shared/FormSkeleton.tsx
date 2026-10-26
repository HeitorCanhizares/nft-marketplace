import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type FormSkeletonProps = {
  fields?: number
  columns?: 1 | 2
  className?: string
}

export function FormSkeleton({ fields = 4, columns = 1, className }: FormSkeletonProps) {
  return (
    <div role="status" aria-busy="true" className={cn('flex flex-col gap-6', className)}>
      <span className="sr-only">Carregando formulário…</span>
      <div className={cn('grid gap-6', columns === 2 ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12.5 w-full lg:h-10" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
