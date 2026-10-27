import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Espelha o formulário: duas colunas de 417 px no desktop e uma coluna no mobile.
function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-[15px] max-lg:gap-2', className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-12.5 w-full lg:h-10" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">Carregando perfil…</span>

      <div className="flex w-full flex-col gap-7 max-lg:gap-8 lg:w-[862px]">
        <Skeleton className="h-4 w-44" />
        <div className="grid gap-7 max-lg:gap-4 lg:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-14" />
            <div className="flex items-center gap-6">
              <Skeleton className="size-12.5 rounded-full max-lg:size-16" />
              <Skeleton className="h-10 w-[98px] max-lg:h-11" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-[21px] max-lg:gap-4 lg:w-[417px]">
        <Skeleton className="h-4 w-36" />
        <FieldSkeleton className="gap-2.5 max-lg:gap-2" />
        <FieldSkeleton className="gap-2.5 max-lg:gap-2" />
        <FieldSkeleton className="gap-2.5 max-lg:gap-2" />
      </div>

      <Skeleton className="h-10 w-[131px] max-lg:h-15 max-lg:w-full" />
    </div>
  )
}
