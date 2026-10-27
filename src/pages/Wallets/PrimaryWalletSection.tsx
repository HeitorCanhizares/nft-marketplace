import { useId, type FormEvent } from 'react'
import { CircleAlertIcon } from 'lucide-react'

import { WalletForm } from '@/components/shared/WalletForm'
import type { useWalletSlotForm } from '@/pages/Wallets/useWalletSlotForm'
import { WalletSaveButton } from '@/pages/Wallets/WalletSaveButton'
import type { Wallet } from '@/types/user'

type PrimaryWalletSectionProps = {
  wallet: Wallet | null
  slotForm: ReturnType<typeof useWalletSlotForm>
}

// Carteira principal: o formulário fica sempre visível; "Adicionar" e "Editar" só levam ao primeiro campo.
export function PrimaryWalletSection({ wallet, slotForm }: PrimaryWalletSectionProps) {
  const headingId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void slotForm.submit()
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <h2 id={headingId} className="text-base leading-none font-bold text-foreground">
          Carteira principal
        </h2>
        <button
          type="button"
          onClick={() => slotForm.focusFirst()}
          className="text-base leading-none font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {wallet === null ? 'Adicionar' : 'Editar'}
        </button>
      </div>

      <p className="mt-1.5 text-sm text-tan">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>

      {slotForm.message && (
        <p role="alert" className="mt-6 flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{slotForm.message}</span>
        </p>
      )}

      <form noValidate onSubmit={handleSubmit} className="mt-9">
        <WalletForm variant="wallets" form={slotForm.form} serverErrors={slotForm.serverErrors} />

        <div className="mt-8">
          <WalletSaveButton isSaving={slotForm.isSaving} disabled={!slotForm.isDirty} />
        </div>
      </form>
    </section>
  )
}
