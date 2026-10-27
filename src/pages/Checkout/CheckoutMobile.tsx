import { useId } from 'react'

import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { WalletConnectionStatus } from '@/components/shared/WalletConnectionStatus'
import { WalletProviderOption } from '@/components/shared/WalletProviderOption'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/formatEth'
import { CHECKOUT_PROVIDER_ORDER } from '@/lib/walletOptions'
import { walletProviderSchema } from '@/schemas/common'
import type { Wallet } from '@/types/user'

import { SavedWalletsSection } from './SavedWalletsSection'
import type { CheckoutViewProps } from './viewProps'

type CheckoutMobileProps = CheckoutViewProps & {
  primaryWallet: Wallet | null
  secondaryWallet: Wallet | null
}

// Pagamento mobile: só o total, sem formulário do colecionador, como no Figma.
export function CheckoutMobile({
  form,
  wallet,
  quote,
  confirm,
  onEditWallet,
  primaryWallet,
  secondaryWallet,
}: CheckoutMobileProps) {
  const emptyStateId = useId()
  const messageId = useId()
  const providerHeadingId = useId()

  const noWallet = primaryWallet === null && secondaryWallet === null
  const selectedWallet =
    form.mode === 'secondary' ? secondaryWallet : form.mode === 'primary' ? primaryWallet : null
  const expectedNetwork = selectedWallet?.network ?? null

  const describedBy =
    [noWallet ? emptyStateId : null, confirm.message ? messageId : null]
      .filter(Boolean)
      .join(' ') || undefined

  function handleProviderChange(value: string) {
    const result = walletProviderSchema.safeParse(value)
    if (result.success) {
      wallet.choose(result.data)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col pb-8">
      <MobileTopBar title="Pagamento com carteira" backTo={{ to: '/carrinho' }} />
      <h1 className="sr-only">Pagamento</h1>

      <div className="flex flex-1 flex-col px-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-foreground">Carteira conectada</h2>
          {wallet.provider !== null ? (
            <Button
              type="button"
              variant="link"
              className="min-h-11 px-0 text-sm font-bold"
              onClick={wallet.changeWallet}
            >
              Trocar carteira
            </Button>
          ) : null}
        </div>

        <div className="mt-3">
          <SavedWalletsSection
            form={form}
            primaryWallet={primaryWallet}
            secondaryWallet={secondaryWallet}
            onEditWallet={onEditWallet}
            emptyStateId={emptyStateId}
          />
        </div>

        <h2 id={providerHeadingId} className="mt-3 text-base font-bold text-foreground">
          Carteira e rede
        </h2>

        <RadioGroup
          aria-labelledby={providerHeadingId}
          value={wallet.provider ?? ''}
          onValueChange={handleProviderChange}
          className="mt-3 gap-4"
        >
          {CHECKOUT_PROVIDER_ORDER.map((provider) => (
            <WalletProviderOption
              key={provider}
              value={provider}
              variant="mobile"
              className="h-[65px] py-3"
            />
          ))}
        </RadioGroup>

        <div className="mt-4">
          <WalletConnectionStatus
            status={wallet.connection.status}
            provider={wallet.provider}
            address={wallet.connection.address}
            network={wallet.connection.network}
            expectedNetwork={expectedNetwork}
            errorCode={wallet.connection.error?.code ?? null}
            hint={wallet.hint}
            onReconnect={wallet.reconnect}
            onSwitchNetwork={wallet.switchToExpected}
            onDisconnect={() => void wallet.connection.disconnect()}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-subtitle">
          <span className="font-bold text-foreground">Total:</span>
          {quote.quote !== undefined ? (
            <span className="font-bold text-price">{formatEth(quote.quote.total)}</span>
          ) : quote.isError ? (
            <span className="text-caption-md text-muted-foreground">
              Não foi possível calcular o total.
            </span>
          ) : (
            <Skeleton className="h-5 w-28" />
          )}
        </div>
        {quote.quote === undefined && quote.isError ? (
          <div className="flex justify-end">
            <Button type="button" variant="link" className="min-h-11" onClick={quote.onRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {confirm.message ? (
          <p id={messageId} role="alert" className="mt-4 text-sm text-destructive">
            {confirm.message}
          </p>
        ) : null}

        <Button
          type="button"
          variant="gradient"
          className="mt-auto h-15 w-full rounded-full text-subtitle"
          disabled={noWallet || confirm.isChecking}
          aria-busy={confirm.isChecking}
          aria-describedby={describedBy}
          onClick={confirm.onConfirm}
        >
          Confirmar compra
        </Button>
      </div>
    </div>
  )
}
