import { useId, useRef } from 'react'

import { LineItemList } from '@/components/shared/LineItemList'
import { PriceSummary } from '@/components/shared/PriceSummary'
import { QuoteChangeList } from '@/components/shared/QuoteChangeList'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SubmitPhase } from '@/hooks/useCheckoutSubmit'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { shortAddress } from '@/lib/address'
import type { QuoteChangeEntry } from '@/lib/quoteDiff'
import { networkLabel, providerLabel } from '@/lib/walletOptions'
import type { Quote } from '@/types/cart'
import type { Network, WalletProvider } from '@/types/nft'

type CheckoutReviewProps = {
  open: boolean
  quote: Quote | null
  changes: readonly QuoteChangeEntry[]
  collectorName: string
  collectorAddress: string
  provider: WalletProvider | null
  walletAddress: string | null
  network: Network | null
  phase: SubmitPhase
  error: string | null
  canPay: boolean
  blockMessage: string | null
  removingId: string | null
  onReconnect: () => void
  onPay: () => void
  onBack: () => void
  onRemoveItem: (itemId: string) => void
}

const TITLE = 'Revisar pedido'
const DESCRIPTION = 'Confira os dados antes de pagar.'

// Revisão final antes do envio: Dialog no desktop, Sheet inferior no mobile.
export function CheckoutReview({
  open,
  quote,
  changes,
  collectorName,
  collectorAddress,
  provider,
  walletAddress,
  network,
  phase,
  error,
  canPay,
  blockMessage,
  removingId,
  onReconnect,
  onPay,
  onBack,
  onRemoveItem,
}: CheckoutReviewProps) {
  const isDesktop = useIsDesktop()
  const isBusy = phase !== 'idle'
  const changesHeadingId = useId()
  const backButtonRef = useRef<HTMLButtonElement>(null)

  // Durante o envio o diálogo não fecha (Esc, clique fora e X são ignorados).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isBusy) onBack()
  }

  // Foco inicial no "Voltar", o padrão seguro.
  function handleOpenAutoFocus(event: Event) {
    event.preventDefault()
    backButtonRef.current?.focus()
  }

  const body = (
    <div className="flex flex-col gap-6 px-5 py-6">
      {changes.length > 0 ? (
        <section
          aria-labelledby={changesHeadingId}
          className="flex flex-col gap-3 rounded-mobile border border-border p-4"
        >
          <h3 id={changesHeadingId} className="text-subtitle text-foreground">
            Os valores mudaram
          </h3>
          <QuoteChangeList changes={changes} onRemoveItem={onRemoveItem} removingId={removingId} />
          <p role="status" className="text-sm font-bold text-foreground">
            Confirme de novo para continuar.
          </p>
        </section>
      ) : null}

      <LineItemList variant="summary" items={quote?.items ?? []} isLoading={quote === null} />

      <dl className="flex flex-col gap-3 text-body">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Colecionador</dt>
          <dd className="text-right text-foreground">{collectorName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Endereço do colecionador</dt>
          <dd className="min-w-0 text-right break-all text-foreground">{collectorAddress}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Carteira</dt>
          <dd className="text-right text-foreground">{walletLabel(provider, walletAddress)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Rede</dt>
          <dd className="text-right text-foreground">
            {network ? networkLabel(network) : 'Não selecionada'}
          </dd>
        </div>
        {quote?.coupon ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Cupom</dt>
            <dd className="text-right text-foreground">{quote.coupon.code}</dd>
          </div>
        ) : null}
      </dl>

      <PriceSummary
        quote={quote ?? undefined}
        isUpdating={false}
        isError={false}
        onRetry={() => undefined}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {blockMessage ? (
        <div className="flex flex-col items-start gap-2">
          <p role="status" className="text-sm text-foreground">
            {blockMessage}
          </p>
          <Button type="button" variant="outline" className="min-h-11" onClick={onReconnect}>
            Conectar carteira
          </Button>
        </div>
      ) : null}
    </div>
  )

  const footer = (
    <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-card p-5 sm:flex-row sm:justify-end">
      <Button
        ref={backButtonRef}
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={isBusy}
        onClick={onBack}
      >
        Voltar
      </Button>
      <Button
        type="button"
        className="min-h-11"
        disabled={!canPay || isBusy}
        aria-busy={isBusy}
        onClick={onPay}
      >
        {payLabel(phase)}
      </Button>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onOpenAutoFocus={handleOpenAutoFocus}
          className="flex max-h-[90dvh] flex-col gap-0 overflow-y-auto p-0 sm:max-w-140"
        >
          <DialogHeader className="px-5 pt-5 pr-14">
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogHeader>
          {body}
          {footer}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={handleOpenAutoFocus}
        className="max-h-[90dvh] gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="px-5 pt-5">
          <SheetTitle>{TITLE}</SheetTitle>
          <SheetDescription>{DESCRIPTION}</SheetDescription>
        </SheetHeader>
        {body}
        {footer}
      </SheetContent>
    </Sheet>
  )
}

function walletLabel(provider: WalletProvider | null, walletAddress: string | null): string {
  if (!provider || !walletAddress) return 'Não conectada'
  return `${providerLabel(provider)}, ${shortAddress(walletAddress)}`
}

function payLabel(phase: SubmitPhase): string {
  switch (phase) {
    case 'idle':
      return 'Confirmar e pagar'
    case 'signing':
    case 'sending':
      return 'Processando...'
    case 'confirming':
      return 'Confirmando seu pedido...'
  }
}
