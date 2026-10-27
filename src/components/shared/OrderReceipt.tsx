import { CheckIcon, CopyIcon, MailOpenIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { LineItemList } from '@/components/shared/LineItemList'
import { PriceSummary } from '@/components/shared/PriceSummary'
import { Button } from '@/components/ui/button'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { shortAddress } from '@/lib/address'
import { explorerName, isExplorerUrl } from '@/lib/explorerUrl'
import { formatEth } from '@/lib/formatEth'
import { cn } from '@/lib/utils'
import { networkLabel } from '@/lib/walletOptions'
import type { Order } from '@/types/order'

type OrderReceiptProps = {
  order: Order
  variant: 'desktop' | 'mobile'
}

const COPY_FEEDBACK_MS = 2000

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const NOOP = (): void => undefined

// Recibo do pedido confirmado: monta só com o snapshot do Order (nunca consulta a API).
export function OrderReceipt({ order, variant }: OrderReceiptProps) {
  const titleId = useId()
  const { announce } = useLiveAnnouncer()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  // Defesa em profundidade: o recibo nunca aparece fora do status confirmado.
  if (order.status !== 'confirmed') {
    return null
  }

  const isDesktop = variant === 'desktop'
  const txHash = order.txHash
  const explorerUrl = order.explorerUrl
  const createdDate = DATE_FORMAT.format(new Date(order.createdAt))

  async function handleCopy() {
    if (txHash === undefined) return
    try {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      announce('ID da transação copiado', 'polite')
    } catch {
      announce('Não foi possível copiar o ID da transação', 'polite')
    }
  }

  const dataCells = [
    {
      label: 'ID da transação',
      value:
        txHash === undefined ? (
          '—'
        ) : (
          <span className="flex items-center gap-1">
            <span aria-hidden="true" title={txHash}>
              {shortAddress(txHash)}
            </span>
            <span className="sr-only">{txHash}</span>
            <button
              type="button"
              aria-label="Copiar ID da transação"
              onClick={handleCopy}
              className="-my-3 -mr-3 inline-flex size-11 items-center justify-center rounded-mobile text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            </button>
          </span>
        ),
    },
    { label: 'Data', value: createdDate },
    { label: 'Total', value: formatEth(order.total) },
    { label: 'Carteira', value: order.wallet.label },
  ]

  return (
    <section aria-labelledby={titleId} className="flex flex-col">
      <header className="flex flex-col items-center text-center">
        <div
          aria-hidden="true"
          className={cn(
            'flex h-20 w-[66px] items-center justify-center text-primary',
            isDesktop ? 'mt-[22px]' : 'mt-0',
          )}
        >
          <MailOpenIcon />
        </div>
        <h2 id={titleId} className="mt-[18px] text-base font-bold text-muted-foreground">
          Seus NFTs agora estão na sua carteira
        </h2>
      </header>

      {isDesktop ? (
        <dl className="-mx-11 mt-[22px] flex h-[65px] items-center justify-center border-y border-primary text-sm text-muted-foreground">
          {dataCells.map((cell) => (
            <div
              key={cell.label}
              className="relative flex flex-col items-center px-4 before:absolute before:top-1/2 before:left-0 before:h-[31px] before:w-px before:-translate-y-1/2 before:bg-primary/60 before:content-[''] first:before:hidden"
            >
              <dt className="font-bold">{cell.label}</dt>
              <dd className="mt-1">{cell.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-card bg-card p-4 text-sm text-muted-foreground">
          {dataCells.map((cell) => (
            <div key={cell.label} className="flex flex-col items-start">
              <dt className="font-bold">{cell.label}</dt>
              <dd className="mt-1">{cell.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <h3 className={cn('text-body font-bold text-foreground', isDesktop ? 'mt-[22px]' : 'mt-6')}>
        Detalhes da transação
      </h3>

      <div className="mt-3">
        <LineItemList variant="receipt" items={order.items} />
      </div>

      <div className="mt-6">
        <PriceSummary
          variant="receipt"
          quote={order}
          showDiscount={order.coupon !== undefined}
          isUpdating={false}
          isError={false}
          onRetry={NOOP}
        />
      </div>

      <p
        className={cn(
          'text-center leading-[22px] text-muted-foreground',
          isDesktop ? 'text-body' : 'text-sm',
        )}
      >
        Transação confirmada na {networkLabel(order.network)}. A propriedade foi transferida para
        sua carteira conectada e registrada na rede.
      </p>

      {explorerUrl !== undefined && isExplorerUrl(explorerUrl) ? (
        <div className="mt-[26px] flex flex-col items-center">
          <Button
            asChild
            variant={isDesktop ? 'default' : 'gradient'}
            className={cn(isDesktop ? 'h-12 w-[186px] text-base' : 'h-[60px] w-full rounded-full')}
          >
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              Ver no {explorerName(order.network)}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </Button>
          <p className="mt-2 text-caption text-muted-foreground">Transação simulada</p>
        </div>
      ) : null}
    </section>
  )
}
