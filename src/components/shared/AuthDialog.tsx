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

// Moldura do modal de Login e Cadastro no desktop. Quem decide o destino ao fechar é a página.
export function AuthDialog({ title, onClose, children, className }: AuthDialogProps) {
  function handleOpenAutoFocus(event: Event) {
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
        className={cn(
          'max-h-[calc(100dvh-2rem)] min-h-150 w-125 max-w-125 gap-0 overflow-y-auto rounded-none border-b-10 p-0 sm:max-w-125 lg:rounded-none',
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
