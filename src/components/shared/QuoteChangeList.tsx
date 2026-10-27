import { ReceiptIcon, RefreshCwIcon, TicketXIcon, XCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { QuoteChangeEntry } from '@/lib/quoteDiff'
import { formatEth } from '@/lib/formatEth'

type QuoteChangeListProps = {
  changes: readonly QuoteChangeEntry[]
  onRemoveItem?: (itemId: string) => void
  removingId?: string | null
}

const ICON_CLASS = 'mt-0.5 size-4 shrink-0 text-destructive'

// Lista textual das mudanças desde a última cotação. Lista vazia não renderiza nada.
export function QuoteChangeList({
  changes,
  onRemoveItem,
  removingId = null,
}: QuoteChangeListProps) {
  if (changes.length === 0) {
    return null
  }

  return (
    <ul aria-label="Mudanças desde a última cotação" className="flex flex-col gap-2">
      {changes.map((entry) => {
        const removeAction =
          entry.kind === 'SOLD_OUT' && onRemoveItem ? (
            <Button
              variant="outline"
              className="min-h-11"
              aria-busy={removingId === entry.itemId}
              disabled={removingId === entry.itemId}
              onClick={() => onRemoveItem(entry.itemId)}
            >
              Remover {entry.name}
            </Button>
          ) : null

        return (
          <li key={entryKey(entry)} className="flex flex-wrap items-start gap-x-3 gap-y-2 text-sm">
            <span className="flex min-w-0 flex-1 items-start gap-2">
              {entryIcon(entry)}
              <span className="text-foreground">{entryText(entry)}</span>
            </span>
            {removeAction}
          </li>
        )
      })}
    </ul>
  )
}

function entryKey(entry: QuoteChangeEntry): string {
  switch (entry.kind) {
    case 'PRICE_CHANGED':
    case 'SOLD_OUT':
      return `${entry.kind}:${entry.itemId}`
    case 'COUPON_EXPIRED':
      return `${entry.kind}:${entry.code}`
    case 'FEE_CHANGED':
      return entry.kind
  }
}

function entryIcon(entry: QuoteChangeEntry): ReactNode {
  switch (entry.kind) {
    case 'PRICE_CHANGED':
      return <RefreshCwIcon aria-hidden="true" className={ICON_CLASS} />
    case 'SOLD_OUT':
      return <XCircleIcon aria-hidden="true" className={ICON_CLASS} />
    case 'COUPON_EXPIRED':
      return <TicketXIcon aria-hidden="true" className={ICON_CLASS} />
    case 'FEE_CHANGED':
      return <ReceiptIcon aria-hidden="true" className={ICON_CLASS} />
  }
}

function entryText(entry: QuoteChangeEntry): string {
  switch (entry.kind) {
    case 'PRICE_CHANGED':
      return `Preço de ${entry.name}: ${formatEth(entry.from)} → ${formatEth(entry.to)}`
    case 'SOLD_OUT':
      return `${entry.name} esgotou.`
    case 'COUPON_EXPIRED':
      return `O cupom ${entry.code} expirou e o desconto foi removido.`
    case 'FEE_CHANGED':
      return `Taxa de rede: ${formatEth(entry.from)} → ${formatEth(entry.to)}`
  }
}
