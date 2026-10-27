import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWalletMutations } from '@/hooks/useWallets'

const ACTION_ERROR = 'Não foi possível concluir. Tente novamente.'

type WalletConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}

type ConfirmDialogProps = WalletConfirmDialogProps & {
  pending: boolean
  title: string
  description: string
  confirmLabel: string
  action: () => Promise<unknown>
}

// Confirmação com botão travado durante o envio. Erro mantém o diálogo aberto.
function WalletConfirmDialog({
  open,
  onOpenChange,
  onDone,
  pending,
  title,
  description,
  confirmLabel,
  action,
}: ConfirmDialogProps) {
  const [failed, setFailed] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) setFailed(false)
    onOpenChange(next)
  }

  async function confirm() {
    if (pending) return
    setFailed(false)
    try {
      await action()
    } catch {
      setFailed(true)
      return
    }
    onOpenChange(false)
    onDone?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {ACTION_ERROR}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void confirm()}
            disabled={pending}
            aria-busy={pending}
          >
            {pending && <Loader2Icon aria-hidden="true" className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RemoveSecondaryDialog(props: WalletConfirmDialogProps) {
  const { removeSecondary, isPending } = useWalletMutations()

  return (
    <WalletConfirmDialog
      {...props}
      title="Remover carteira secundária?"
      description="Ela deixará de aparecer no pagamento. Você pode cadastrar outra depois."
      pending={isPending}
      confirmLabel="Remover"
      action={removeSecondary}
    />
  )
}

export function SwapWalletsDialog(props: WalletConfirmDialogProps) {
  const { swap, isPending } = useWalletMutations()

  return (
    <WalletConfirmDialog
      {...props}
      title="Tornar principal?"
      description="A carteira secundária passa a ser a principal e a principal passa a ser a secundária."
      pending={isPending}
      confirmLabel="Tornar principal"
      action={swap}
    />
  )
}
