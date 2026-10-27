import { useId, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { CircleAlertIcon } from 'lucide-react'

import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { PasswordRequirements } from '@/components/shared/PasswordRequirements'
import type { ProfileFormValues } from '@/schemas/profile'

type PasswordSectionProps = {
  form: UseFormReturn<ProfileFormValues>
  serverErrors: Partial<Record<'currentPassword' | 'newPassword', string>>
  formMessage: string | null
}

// Senha só é obrigatória quando algum dos três campos é preenchido (regra do schema do formulário).
export function PasswordSection({ form, serverErrors, formMessage }: PasswordSectionProps) {
  const headingId = useId()
  const { register, control } = form
  const { errors } = form.formState
  const [newPasswordFocused, setNewPasswordFocused] = useState(false)
  const newPassword = useWatch({ control, name: 'newPassword' })
  const newPasswordField = register('newPassword')
  // Requisitos aparecem só com foco ou valor; vazio, o layout é o do Figma.
  const showRequirements = newPasswordFocused || newPassword !== ''

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-[21px] max-lg:gap-4 lg:w-[417px]"
    >
      <h2 id={headingId} className="text-base font-bold text-foreground">
        Alterar senha
      </h2>

      <FormField
        label="Senha atual"
        className="gap-2.5 max-lg:gap-2"
        error={errors.currentPassword?.message ?? serverErrors.currentPassword}
      >
        {(field) => (
          <PasswordInput
            {...field}
            {...register('currentPassword')}
            autoComplete="current-password"
          />
        )}
      </FormField>

      <FormField
        label="Nova senha"
        className="gap-2.5 max-lg:gap-2"
        error={errors.newPassword?.message ?? serverErrors.newPassword}
        description={
          showRequirements ? <PasswordRequirements value={newPassword} className="mt-2" /> : null
        }
      >
        {(field) => (
          <PasswordInput
            {...field}
            {...newPasswordField}
            autoComplete="new-password"
            onFocus={() => setNewPasswordFocused(true)}
            onBlur={(event) => {
              newPasswordField.onBlur(event)
              setNewPasswordFocused(false)
            }}
          />
        )}
      </FormField>

      <FormField
        label="Confirmar nova senha"
        className="gap-2.5 max-lg:gap-2"
        error={errors.confirmNewPassword?.message}
      >
        {(field) => (
          <PasswordInput
            {...field}
            {...register('confirmNewPassword')}
            autoComplete="new-password"
          />
        )}
      </FormField>

      {formMessage && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{formMessage}</span>
        </p>
      )}
    </section>
  )
}
