import { Link } from '@tanstack/react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { SavedWalletOption } from '@/components/shared/SavedWalletOption'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import type { Wallet } from '@/types/user'

import type { CheckoutFormApi } from './viewProps'

type SavedWalletsSectionProps = {
  form: CheckoutFormApi
  primaryWallet: Wallet | null
  secondaryWallet: Wallet | null
  onEditWallet: () => void
  // Id do estado vazio, para o botão "Confirmar compra" descrevê-lo.
  emptyStateId?: string
}

// Carteiras salvas do Pagamento (mobile): a secundária vem antes da principal, como no Figma.
export function SavedWalletsSection({
  form,
  primaryWallet,
  secondaryWallet,
  onEditWallet,
  emptyStateId,
}: SavedWalletsSectionProps) {
  if (primaryWallet === null && secondaryWallet === null) {
    return (
      <div id={emptyStateId}>
        <EmptyState
          as="h3"
          className="px-0 py-6"
          title="Cadastre uma carteira para continuar"
          action={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/perfil/carteiras" search={{ redirect: '/pagamento' }}>
                Adicionar carteira
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  // Só primary e secondary são valores válidos para as carteiras salvas.
  const savedValue = form.mode === 'primary' || form.mode === 'secondary' ? form.mode : ''

  function handleValueChange(value: string) {
    if (value === 'primary' || value === 'secondary') {
      form.setMode(value)
    }
  }

  return (
    <RadioGroup
      aria-label="Carteiras salvas"
      value={savedValue}
      onValueChange={handleValueChange}
      className="gap-5"
    >
      {secondaryWallet !== null ? (
        <SavedWalletOption value="secondary" wallet={secondaryWallet} onEdit={onEditWallet} />
      ) : null}
      {primaryWallet !== null ? (
        <SavedWalletOption value="primary" wallet={primaryWallet} onEdit={onEditWallet} />
      ) : null}
    </RadioGroup>
  )
}
