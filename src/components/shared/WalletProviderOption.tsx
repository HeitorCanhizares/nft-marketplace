import { useId } from 'react'
import { WalletIcon } from 'lucide-react'

import { RadioGroupItem } from '@/components/ui/radio-group'
import { providerLabel } from '@/lib/walletOptions'
import { cn } from '@/lib/utils'
import type { WalletProvider } from '@/types/nft'

export type WalletProviderOptionProps = {
  value: WalletProvider
  variant: 'desktop' | 'mobile'
  disabled?: boolean
  className?: string
}

// Inicial do avatar no mobile. Null mostra o ícone da carteira (Coinbase).
const PROVIDER_INITIAL: Record<WalletProvider, string | null> = {
  metamask: 'M',
  walletconnect: 'W',
  coinbase: null,
}

// Cartão de rádio de provedor. Precisa estar dentro de um RadioGroup da página.
export function WalletProviderOption({
  value,
  variant,
  disabled = false,
  className,
}: WalletProviderOptionProps) {
  const id = useId()
  const isMobile = variant === 'mobile'
  const initial = PROVIDER_INITIAL[value]

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50',
        isMobile
          ? 'min-h-16 gap-[11px] rounded-mobile bg-card py-3.5 pr-4 pl-3.5'
          : 'h-[45px] w-full gap-2.5 rounded-mobile border border-border pl-3 has-data-[state=checked]:border-foreground',
        className,
      )}
    >
      {isMobile ? (
        <>
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground"
          >
            {initial ?? <WalletIcon className="size-5" />}
          </span>
          <span className="min-w-0 flex-1 text-sm text-foreground">{providerLabel(value)}</span>
          <RadioGroupItem id={id} value={value} disabled={disabled} />
        </>
      ) : (
        <>
          <RadioGroupItem id={id} value={value} disabled={disabled} />
          <span className="min-w-0 flex-1 text-sm text-foreground">{providerLabel(value)}</span>
        </>
      )}
    </label>
  )
}
