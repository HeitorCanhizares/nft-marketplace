import { useId } from 'react'

import { CouponField } from '@/components/shared/CouponField'
import { LineItemList } from '@/components/shared/LineItemList'
import { PriceSummary } from '@/components/shared/PriceSummary'
import { WalletConnectionStatus } from '@/components/shared/WalletConnectionStatus'
import { WalletProviderOption } from '@/components/shared/WalletProviderOption'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { CHECKOUT_PROVIDER_ORDER } from '@/lib/walletOptions'

import type { CheckoutViewProps } from './viewProps'

// Coluna direita do desktop: NFTs, cupom, valores, carteira e confirmação.
export function OrderSummaryColumn({
  items,
  form,
  wallet,
  quote,
  coupon,
  confirm,
}: CheckoutViewProps) {
  const walletHeadingId = useId()
  const messageId = useId()

  function handleProviderChange(value: string) {
    const provider = CHECKOUT_PROVIDER_ORDER.find((option) => option === value)
    if (provider !== undefined) wallet.choose(provider)
  }

  function handleConfirm() {
    if (confirm.isChecking) return
    confirm.onConfirm()
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-subtitle font-bold text-foreground">Seus NFTs</h2>
      <div className="mt-2">
        <LineItemList variant="summary" items={items} />
      </div>

      <div className="mt-5">
        <CouponField
          variant="desktop"
          collapsible
          coupon={coupon.coupon}
          onApply={coupon.onApply}
          onRemove={coupon.onRemove}
          isApplying={coupon.isApplying}
          isRemoving={coupon.isRemoving}
          error={coupon.couponError}
        />
      </div>

      <div className="mt-5">
        <PriceSummary
          variant="checkout"
          quote={quote.quote}
          isUpdating={quote.isUpdating}
          isError={quote.isError}
          onRetry={quote.onRetry}
        />
      </div>

      <section aria-labelledby={walletHeadingId} className="mt-6 flex flex-col">
        <h2 id={walletHeadingId} className="text-center text-subtitle font-bold text-foreground">
          Carteira e rede
        </h2>
        <RadioGroup
          aria-labelledby={walletHeadingId}
          value={wallet.provider ?? ''}
          onValueChange={handleProviderChange}
          className="mt-4 gap-4"
        >
          {CHECKOUT_PROVIDER_ORDER.map((option) => (
            <WalletProviderOption key={option} value={option} variant="desktop" />
          ))}
        </RadioGroup>

        <div className="mt-4">
          <WalletConnectionStatus
            status={wallet.connection.status}
            provider={wallet.provider}
            address={wallet.connection.address}
            network={wallet.connection.network}
            expectedNetwork={form.network}
            errorCode={wallet.connection.error?.code ?? null}
            hint={wallet.hint}
            onReconnect={wallet.reconnect}
            onSwitchNetwork={wallet.switchToExpected}
            onDisconnect={wallet.changeWallet}
          />
        </div>

        <Button
          type="button"
          aria-busy={confirm.isChecking}
          aria-describedby={confirm.message !== null ? messageId : undefined}
          onClick={handleConfirm}
          className="mt-6 h-[45px] w-full"
        >
          Confirmar compra
        </Button>
        {confirm.message !== null ? (
          <p id={messageId} role="alert" className="mt-3 text-caption text-destructive">
            {confirm.message}
          </p>
        ) : null}
      </section>
    </div>
  )
}
