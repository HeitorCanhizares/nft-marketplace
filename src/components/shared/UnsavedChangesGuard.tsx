import { useRef } from 'react'
import { useBlocker } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type UnsavedChangesGuardProps = {
  when: boolean
}

// Bloqueia a navegação com alterações não salvas (diálogo) e a saída da aba (aviso nativo).
export function UnsavedChangesGuard({ when }: UnsavedChangesGuardProps) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: () => when,
    withResolver: true,
  })
  const continueRef = useRef<HTMLButtonElement | null>(null)

  if (blocker.status !== 'blocked') return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) blocker.reset()
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          continueRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Descartar alterações?</DialogTitle>
          <DialogDescription>Você tem alterações que ainda não foram salvas.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => blocker.proceed()}>
            Descartar
          </Button>
          <Button type="button" ref={continueRef} onClick={() => blocker.reset()}>
            Continuar editando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
