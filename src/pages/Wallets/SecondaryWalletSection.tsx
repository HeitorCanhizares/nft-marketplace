import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CircleAlertIcon } from 'lucide-react'

import { WalletForm } from '@/components/shared/WalletForm'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RemoveSecondaryDialog, SwapWalletsDialog } from '@/pages/Wallets/WalletConfirmDialogs'
import type { useWalletSlotForm } from '@/pages/Wallets/useWalletSlotForm'
import { WalletSaveButton } from '@/pages/Wallets/WalletSaveButton'
import { copyWalletValues } from '@/schemas/wallet'
import type { Wallet } from '@/types/user'

const SAME_VALUE = 'same'

type SecondaryWalletSectionProps = {
  wallet: Wallet | null
  primary: Wallet | null
  slotForm: ReturnType<typeof useWalletSlotForm>
  anyDirty: boolean
  onSwapDone?: () => void
}

// Carteira secundária: vazio, formulário (adicionar ou editar) e ações com a secundária salva.
export function SecondaryWalletSection({
  wallet,
  primary,
  slotForm,
  anyDirty,
  onSwapDone,
}: SecondaryWalletSectionProps) {
  const headingId = useId()
  const sameId = useId()
  const primaryHintId = useId()
  const swapHintId = useId()
  const { form } = slotForm
  const hasWallet = wallet !== null

  const [adding, setAdding] = useState(false)
  const [sameChecked, setSameChecked] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [addFocusToken, setAddFocusToken] = useState(0)
  const [previousHasWallet, setPreviousHasWallet] = useState(hasWallet)
  const addLinkRef = useRef<HTMLButtonElement>(null)

  // Salvar (vazio -> salva) ou remover (salva -> vazio) encerra a adição em curso.
  if (previousHasWallet !== hasWallet) {
    setPreviousHasWallet(hasWallet)
    setAdding(false)
    setSameChecked(false)
  }

  const showForm = adding || hasWallet

  // Foco no primeiro campo depois que o formulário de adição aparece.
  useEffect(() => {
    if (adding) form.setFocus('displayName')
  }, [adding, form])

  // Foco no link "Adicionar" depois de remover a secundária.
  useEffect(() => {
    if (addFocusToken > 0) addLinkRef.current?.focus()
  }, [addFocusToken])

  function handleLinkClick() {
    if (!hasWallet && !adding) {
      setAdding(true)
      return
    }
    slotForm.focusFirst()
  }

  // "Igual à carteira principal": copia uma única vez os dados salvos da principal.
  function handleSameChange(value: string) {
    if (value !== SAME_VALUE || primary === null) return
    slotForm.applyValues(copyWalletValues(primary))
    setSameChecked(true)
    if (adding) {
      slotForm.focusFirst()
    } else {
      setAdding(true)
    }
  }

  function handleRemoveDone() {
    setAdding(false)
    setSameChecked(false)
    setAddFocusToken((token) => token + 1)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void slotForm.submit()
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id={headingId} className="text-base leading-none font-bold text-foreground">
          Carteira secundária
        </h2>

        <div className="flex items-center gap-2.5">
          {!hasWallet && (
            <RadioGroup
              value={sameChecked ? SAME_VALUE : ''}
              onValueChange={handleSameChange}
              disabled={primary === null}
              aria-describedby={primary === null ? primaryHintId : undefined}
              className="flex items-center gap-2.5"
            >
              <RadioGroupItem id={sameId} value={SAME_VALUE} />
              <Label htmlFor={sameId} className="font-normal text-foreground">
                Igual à carteira principal
              </Label>
            </RadioGroup>
          )}

          <button
            ref={addLinkRef}
            type="button"
            onClick={handleLinkClick}
            className="text-base leading-none font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {hasWallet ? 'Editar' : 'Adicionar'}
          </button>
        </div>
      </div>

      {!hasWallet && primary === null && (
        <p id={primaryHintId} className="mt-1 text-xs text-tan">
          Cadastre a carteira principal primeiro.
        </p>
      )}

      {!showForm && (
        <p className="mt-7 text-sm text-tan">Você ainda não adicionou uma carteira secundária.</p>
      )}

      {showForm && (
        <>
          {slotForm.message && (
            <p role="alert" className="mt-6 flex items-start gap-2 text-sm text-destructive">
              <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{slotForm.message}</span>
            </p>
          )}

          <form noValidate onSubmit={handleSubmit} className="mt-10">
            <WalletForm
              variant="wallets"
              form={slotForm.form}
              serverErrors={slotForm.serverErrors}
            />

            <div className="mt-8">
              <WalletSaveButton isSaving={slotForm.isSaving} disabled={!slotForm.isDirty} />
            </div>
          </form>
        </>
      )}

      {hasWallet && (
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start">
          <Button type="button" variant="outline" onClick={() => setRemoveOpen(true)}>
            Remover carteira secundária
          </Button>

          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              disabled={anyDirty}
              aria-describedby={anyDirty ? swapHintId : undefined}
              onClick={() => setSwapOpen(true)}
            >
              Tornar principal
            </Button>
            {anyDirty && (
              <p id={swapHintId} className="text-xs text-tan">
                Salve ou descarte as alterações para trocar.
              </p>
            )}
          </div>
        </div>
      )}

      {hasWallet && (
        <>
          <RemoveSecondaryDialog
            open={removeOpen}
            onOpenChange={setRemoveOpen}
            onDone={handleRemoveDone}
          />
          <SwapWalletsDialog open={swapOpen} onOpenChange={setSwapOpen} onDone={onSwapDone} />
        </>
      )}
    </section>
  )
}
