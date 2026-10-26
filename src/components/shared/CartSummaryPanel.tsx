import { useId } from 'react'
import { Link } from '@tanstack/react-router'

import { CouponField, type CouponFieldProps } from '@/components/shared/CouponField'
import { PriceSummary } from '@/components/shared/PriceSummary'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Quote } from '@/types/cart'

export type CartSummaryPanelProps = {
  variant: 'desktop' | 'mobile'
  coupon: CouponFieldProps['coupon']
  onApply: CouponFieldProps['onApply']
  onRemove: CouponFieldProps['onRemove']
  isApplying: boolean
  isRemoving: boolean
  couponError: CouponFieldProps['error']
  quote?: Quote
  isUpdating: boolean
  isQuoteError: boolean
  onRetryQuote: () => void
  checkout: {
    canCheckout: boolean
    reason: string | null
    onCheckout: () => void
  }
}

// Resumo do pedido: cupom, valores e o botão de fechar. Desktop é coluna; mobile é painel fixo no rodapé.
export function CartSummaryPanel({
  variant,
  coupon,
  onApply,
  onRemove,
  isApplying,
  isRemoving,
  couponError,
  quote,
  isUpdating,
  isQuoteError,
  onRetryQuote,
  checkout,
}: CartSummaryPanelProps) {
  const titleId = useId()
  const reasonId = useId()
  const isMobile = variant === 'mobile'

  const couponField = (
    <CouponField
      variant={variant}
      labelHidden={isMobile}
      coupon={coupon}
      onApply={onApply}
      onRemove={onRemove}
      isApplying={isApplying}
      isRemoving={isRemoving}
      error={couponError}
    />
  )

  const values = (
    <PriceSummary
      quote={quote}
      isUpdating={isUpdating}
      isError={isQuoteError}
      onRetry={onRetryQuote}
    />
  )

  const checkoutButton = (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={isMobile ? 'gradient' : 'default'}
        className={cn('min-h-11 w-full', isMobile && 'rounded-full')}
        disabled={!checkout.canCheckout}
        aria-describedby={checkout.reason !== null ? reasonId : undefined}
        onClick={checkout.onCheckout}
      >
        Conectar e finalizar
      </Button>
      {checkout.reason !== null ? (
        <p id={reasonId} className="text-caption-md text-muted-foreground">
          {checkout.reason}
        </p>
      ) : null}
    </div>
  )

  if (isMobile) {
    return (
      <section
        aria-label="Resumo do pedido"
        className="sticky bottom-0 z-10 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto rounded-t-panel border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {couponField}
        {values}
        {checkoutButton}
      </section>
    )
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2
        id={titleId}
        className="border-b border-border pb-3 text-subtitle font-bold text-foreground"
      >
        Resumo do pedido
      </h2>
      {couponField}
      {values}
      {checkoutButton}
      <Link to="/" hash="catalogo" className="text-center text-body text-primary hover:underline">
        Continuar explorando
      </Link>
    </section>
  )
}
