import { Skeleton } from '@/components/ui/skeleton'
import { useIsDesktop } from '@/hooks/useMediaQuery'

// Skeleton da página de detalhe: sem h1, com texto "Carregando…" para leitores de tela.
export function NftDetailSkeleton() {
  const isDesktop = useIsDesktop()

  return (
    <div role="status" aria-busy="true" className="w-full">
      <span className="sr-only">Carregando…</span>
      {isDesktop ? (
        <div className="container-page flex flex-col gap-16 py-8">
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex flex-col gap-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-96" />
        </div>
      ) : (
        <div className="flex flex-col">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="-mt-6 flex flex-col gap-6 rounded-t-mobile bg-background p-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="fixed inset-x-0 bottom-0 border-t border-border-soft bg-background p-4">
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      )}
    </div>
  )
}
