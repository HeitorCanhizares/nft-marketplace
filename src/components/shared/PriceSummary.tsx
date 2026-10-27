import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/formatEth'
import { cn } from '@/lib/utils'
import type { Quote } from '@/types/cart'

type PriceSummaryProps = {
  quote?: Quote
  isUpdating: boolean
  isError: boolean
  onRetry: () => void
  variant?: 'default' | 'checkout'
}

// Valores vêm prontos da cotação: o front só exibe, sem contas.
export function PriceSummary({
  quote,
  isUpdating,
  isError,
  onRetry,
  variant = 'default',
}: PriceSummaryProps) {
  if (quote === undefined && isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-caption-md text-muted-foreground">
          Não foi possível calcular os valores.
        </p>
        <Button type="button" variant="link" className="min-h-11" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (quote === undefined) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    )
  }

  if (variant === 'checkout') {
    return (
      <div aria-busy={isUpdating} className={cn('flex flex-col', isUpdating && 'opacity-60')}>
        {isUpdating ? <span className="sr-only">Atualizando valores</span> : null}
        <dl className="flex flex-col gap-[13px]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body text-foreground">Subtotal</dt>
            <dd className="text-subtitle text-foreground tabular-nums">
              {formatEth(quote.subtotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body text-foreground">Desconto do lançamento</dt>
            <dd className="text-subtitle text-foreground tabular-nums">
              (-) {formatEth(quote.discount)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body text-foreground">Taxa de rede</dt>
            <dd className="text-subtitle text-foreground tabular-nums">
              {formatEth(quote.networkFee)}
            </dd>
          </div>
        </dl>
        {quote.networkFeeEstimated ? (
          <p className="mt-3 text-center text-caption text-muted-foreground">Taxa estimada</p>
        ) : null}
        <dl className="mt-[18px] border-t border-border pt-3">
          <div className="flex items-baseline justify-between gap-4 px-[42px]">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="text-subtitle font-bold text-primary tabular-nums">
              {formatEth(quote.total)}
            </dd>
          </div>
        </dl>
      </div>
    )
  }

  return (
    <div aria-busy={isUpdating} className={cn('flex flex-col gap-3', isUpdating && 'opacity-60')}>
      {isUpdating ? <span className="sr-only">Atualizando valores</span> : null}
      <dl className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-body text-foreground">Subtotal</dt>
          <dd className="text-subtitle text-foreground tabular-nums">
            {formatEth(quote.subtotal)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-body text-foreground">Desconto do lançamento</dt>
          <dd className="text-subtitle text-foreground tabular-nums">
            (-) {formatEth(quote.discount)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-body text-foreground">Taxa de rede</dt>
          <dd className="flex flex-col items-end gap-0.5">
            <span className="text-subtitle text-foreground tabular-nums">
              {formatEth(quote.networkFee)}
            </span>
            {quote.networkFeeEstimated ? (
              <span className="text-caption text-muted-foreground">Taxa estimada</span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-1">
          <dt className="font-bold text-foreground">Total</dt>
          <dd className="text-subtitle font-bold text-primary tabular-nums">
            {formatEth(quote.total)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
