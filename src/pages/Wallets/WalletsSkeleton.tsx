import { Skeleton } from '@/components/ui/skeleton'

const FIELD_COUNT = 10

// Espelha os dois blocos: duas colunas de 417 px no desktop e uma coluna no mobile.
function BlockSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />

      <div className="mt-10 grid gap-x-7 gap-y-[34px] max-lg:gap-4 lg:grid-cols-2">
        {Array.from({ length: FIELD_COUNT }, (_, index) => (
          <div key={index} className="flex flex-col gap-[15px] max-lg:gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12.5 w-full lg:h-10" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-8 h-10 w-[131px] max-lg:h-15 max-lg:w-full" />
    </div>
  )
}

export function WalletsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex w-full flex-col gap-8 lg:w-[862px] lg:gap-[35px]"
    >
      <span className="sr-only">Carregando carteiras…</span>
      <BlockSkeleton />
      <BlockSkeleton />
    </div>
  )
}
