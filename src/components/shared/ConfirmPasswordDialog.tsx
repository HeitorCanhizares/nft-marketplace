import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { z } from 'zod'

import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'

const confirmPasswordSchema = z.object({
  password: z
    .string({ error: 'Informe sua senha atual.' })
    .min(1, { error: 'Informe sua senha atual.' }),
})

type ConfirmPasswordValues = z.input<typeof confirmPasswordSchema>

type ConfirmPasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (password: string) => void
  submitting: boolean
  error?: string
}

// Pede a senha atual antes de trocar o e-mail. Erro da API fica no campo e devolve o foco a ele.
export function ConfirmPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  error,
}: ConfirmPasswordDialogProps) {
  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<ConfirmPasswordValues>(
    zodResolver(confirmPasswordSchema),
  )
  const form = useForm<ConfirmPasswordValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: { password: '' },
  })
  const { register, handleSubmit, reset, setFocus, formState } = form
  const fieldError = formState.errors.password?.message ?? error

  useEffect(() => {
    if (open && error) setFocus('password')
  }, [error, open, setFocus])

  function handleOpenChange(next: boolean) {
    if (!next) reset({ password: '' })
    onOpenChange(next)
  }

  function onValid(values: ConfirmPasswordValues) {
    if (submitting) return
    onConfirm(values.password)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirme sua senha</DialogTitle>
          <DialogDescription>Para alterar o e-mail, informe sua senha atual.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            markSubmitAttempt()
            void handleSubmit(onValid)(event)
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Senha atual" required error={fieldError}>
            {(field) => (
              <PasswordInput
                {...field}
                {...register('password')}
                autoComplete="current-password"
                disabled={submitting}
              />
            )}
          </FormField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting && <Loader2Icon aria-hidden="true" className="animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
