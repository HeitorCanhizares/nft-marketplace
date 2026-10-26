import { cn } from '@/lib/utils'

const WALLETS = ['MetaMask', 'WalletConnect', 'Coinbase'] as const

type WalletBadgesProps = {
  className?: string
}

// Selo de carteiras compatíveis; o texto em maiúsculas é só CSS (o leitor de tela lê o nome original).
export function WalletBadges({ className }: WalletBadgesProps) {
  return (
    <ul
      aria-label="Carteiras compatíveis"
      className={cn(
        'flex min-h-6.5 w-57 max-w-full flex-wrap items-center justify-between rounded-lg border border-border-soft bg-surface-3 px-2.5 py-1 text-tiny font-bold text-primary uppercase',
        className,
      )}
    >
      {WALLETS.map((wallet, index) => (
        <li key={wallet} className="flex items-center gap-3">
          {wallet}
          {index < WALLETS.length - 1 && (
            <span aria-hidden="true" className="text-primary">
              •
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
