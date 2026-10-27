import type { ReactNode } from 'react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type OrderDialogProps = {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

// Quem abriu o modal. O Radix só devolve o foco a um Dialog.Trigger, que aqui não existe (o modal é
// uma rota). Fica fora do componente, como no AuthDialog.
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
  // Troca de modal: outro modal já tomou o lugar e o foco dele não pode ser roubado.
  if (document.querySelector('[role="dialog"]')) return

  const target = opener
  opener = null
  if (!target?.isConnected) return

  event.preventDefault()
  target.focus()
}

// Moldura do modal da Confirmação no desktop. Fundo da página opaco em `background`; modal ancorado
// pelo topo (166 px, como no Figma; menos em viewport baixa, onde o modal rola por dentro). O h1 de
// título é o mesmo nó em todos os estados, então o foco não se move quando o pedido muda.
// Quem decide o destino ao fechar é a página.
export function OrderDialog({ title, onClose, children, className }: OrderDialogProps) {
  function handleOpenAutoFocus(event: Event) {
    rememberOpener()
    const heading =
      event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector('h1') : null
    if (!heading) return

    event.preventDefault()
    heading.focus()
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
        overlayClassName="bg-background"
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        className={cn(
          'top-[clamp(16px,calc(100dvh-837px),166px)] max-h-[calc(100dvh-2rem)] w-[578px] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-y-auto rounded-none border-b-10 bg-card p-0 sm:max-w-[calc(100%-2rem)] lg:rounded-none',
          className,
        )}
      >
        <DialogTitle asChild>
          <h1 tabIndex={-1} className="sr-only">
            {title}
          </h1>
        </DialogTitle>
        {children}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            className="absolute top-[3px] right-[2px] size-11 text-primary hover:bg-transparent hover:text-primary"
          >
            <SvgIcon name="x" size={13} />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
