import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/formatEth'
import { cn } from '@/lib/utils'
import type { Quote } from '@/types/cart'

// Valores prontos: uma cotação (Quote) ou um pedido (Order) servem.
type PriceSummaryValues = Pick<Quote, 'subtotal' | 'discount' | 'networkFee' | 'total'> & {
  networkFeeEstimated?: boolean
}

type PriceSummaryProps = {
  quote?: PriceSummaryValues
  isUpdating: boolean
  isError: boolean
  onRetry: () => void
  variant?: 'default' | 'checkout' | 'receipt'
  showDiscount?: boolean
}

type ReceiptRowProps = {
  label: string
  value: string
  total?: boolean
}

// Linha do recibo: passo fixo de 30 px (medido em desktop-confirmacao.png); rótulo a 169 px da borda a partir de lg.
function ReceiptRow({ label, value, total = false }: ReceiptRowProps) {
  return (
    <div className="flex h-[30px] items-center justify-between gap-4">
      <dt className={cn('text-body text-foreground', total && 'font-bold')}>{label}</dt>
      <dd
        className={cn(
          'text-subtitle tabular-nums',
          total ? 'font-bold text-price' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

// Valores vêm prontos da cotação: o front só exibe, sem contas.
export function PriceSummary({
  quote,
  isUpdating,
  isError,
  onRetry,
  variant = 'default',
  showDiscount = false,
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

  // Recibo do pedido confirmado: sempre com valores, sem "Taxa estimada" e sem estados de atualização.
  if (variant === 'receipt') {
    return (
      <div className="mb-[18px] flex flex-col lg:mb-[13px]">
        <dl className="flex flex-col lg:pl-[169px]">
          {showDiscount ? (
            <>
              <ReceiptRow label="Subtotal" value={formatEth(quote.subtotal)} />
              <ReceiptRow
                label="Desconto do lançamento"
                value={`(-) ${formatEth(quote.discount)}`}
              />
            </>
          ) : null}
          <ReceiptRow label="Taxa de rede" value={formatEth(quote.networkFee)} />
          <ReceiptRow label="Total" value={formatEth(quote.total)} total />
        </dl>
        <div aria-hidden="true" className="mt-1 h-px bg-border-soft lg:mt-[3px]" />
      </div>
    )
  }

  if (variant === 'checkout') {
    return (
      <div aria-busy={isUpdating} className={cn('flex flex-col', isUpdating && 'opacity-60')}>
        {isUpdating ? <span className="sr-only">Atualizando valores</span> : null}
        <dl className="flex flex-col gap-[7px]">
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
          <p className="mt-[6px] text-center text-caption text-muted-foreground">Taxa estimada</p>
        ) : null}
        <dl className="mt-2.5 border-t border-border pt-2">
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
