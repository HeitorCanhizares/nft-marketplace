import type { ReactNode } from 'react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type AuthDialogProps = {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

// Quem abriu o modal. O Radix só devolve o foco a um Dialog.Trigger, que aqui não existe (o modal é
// uma rota). Fica fora do componente para sobreviver à troca entre Entrar e Criar conta, em que a
// rota troca o componente.
let opener: HTMLElement | null = null

function rememberOpener() {
  const active = document.activeElement
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    !active.closest('[role="dialog"]')
  ) {
    opener = active
  }
}

function handleCloseAutoFocus(event: Event) {
  // Troca de aba: outro modal já tomou o lugar e o foco dele não pode ser roubado.
  if (document.querySelector('[role="dialog"]')) return

  const target = opener
  opener = null
  if (!target?.isConnected) return

  event.preventDefault()
  target.focus()
}

// Moldura do modal de Login e Cadastro no desktop. Quem decide o destino ao fechar é a página.
export function AuthDialog({ title, onClose, children, className }: AuthDialogProps) {
  function handleOpenAutoFocus(event: Event) {
    rememberOpener()
    const input =
      event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector('input') : null
    if (!input) return

    event.preventDefault()
    input.focus()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-transparent"
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        className={cn(
          'max-h-[calc(100dvh-2rem)] min-h-[min(37.5rem,calc(100dvh-2rem))] w-125 max-w-125 gap-0 overflow-y-auto rounded-none border-b-10 p-0 sm:max-w-125 lg:rounded-none',
          className,
        )}
      >
        <DialogTitle asChild>
          <h1 className="sr-only">{title}</h1>
        </DialogTitle>
        {children}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            className="absolute top-0 right-0 text-primary hover:bg-transparent hover:text-primary"
          >
            <SvgIcon name="x" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
