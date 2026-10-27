import { useCallback, useEffect, useId, type ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { CircleAlertIcon, Loader2Icon } from 'lucide-react'

import { AUTH_INPUT_CLASS } from '@/components/shared/authStyles'
import { EnsInput } from '@/components/shared/EnsInput'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import type { AvailabilityStatus, useAvailability } from '@/hooks/useAvailability'
import type { ProfileFormValues } from '@/schemas/profile'

type AvailabilityField = 'username' | 'email'
type Availability = ReturnType<typeof useAvailability>
type ServerFieldKey = 'displayName' | 'username' | 'email' | 'ensLabel' | 'walletNickname'

type ProfileDataSectionProps = {
  form: UseFormReturn<ProfileFormValues>
  currentUser: { username: string; email: string }
  usernameAvailability: Availability
  emailAvailability: Availability
  serverErrors: Partial<Record<ServerFieldKey, string>>
  formMessage: string | null
  avatarSlot: ReactNode
}

const AVAILABILITY_ERROR = 'availability'
const TAKEN_MESSAGE: Record<AvailabilityField, string> = {
  username: 'Este nome de usuário já está em uso',
  email: 'Este e-mail já está cadastrado',
}

// Valor igual ao do usuário atual não consulta disponibilidade.
function isSameAsCurrent(value: string, current: string): boolean {
  return value.trim().toLowerCase() === current.toLowerCase()
}

export function ProfileDataSection({
  form,
  currentUser,
  usernameAvailability,
  emailAvailability,
  serverErrors,
  formMessage,
  avatarSlot,
}: ProfileDataSectionProps) {
  const headingId = useId()
  const { register, control, setError, clearErrors, getFieldState, getValues, trigger } = form
  const { errors } = form.formState

  // Traduz a disponibilidade em erro de campo; só mexe nos erros do tipo "availability".
  const syncAvailability = useCallback(
    (field: AvailabilityField, status: AvailabilityStatus) => {
      if (status === 'taken') {
        setError(field, { type: AVAILABILITY_ERROR, message: TAKEN_MESSAGE[field] })
        return
      }
      if (
        (status === 'available' || status === 'idle') &&
        getFieldState(field).error?.type === AVAILABILITY_ERROR
      ) {
        clearErrors(field)
      }
    },
    [setError, clearErrors, getFieldState],
  )

  useEffect(() => {
    syncAvailability('username', usernameAvailability.status)
  }, [usernameAvailability.status, syncAvailability])

  useEffect(() => {
    syncAvailability('email', emailAvailability.status)
  }, [emailAvailability.status, syncAvailability])

  // Depois da validação do zod passar, consulta a disponibilidade do campo.
  function checkOnBlur(field: AvailabilityField, availability: Availability) {
    const value = getValues(field).trim()
    if (isSameAsCurrent(value, currentUser[field])) {
      availability.cancel()
      return
    }
    void trigger(field).then((valid) => {
      if (valid) availability.check(value)
    })
  }

  const usernameField = register('username', {
    onBlur: () => checkOnBlur('username', usernameAvailability),
    onChange: () => usernameAvailability.cancel(),
  })
  const emailField = register('email', {
    onBlur: () => checkOnBlur('email', emailAvailability),
    onChange: () => emailAvailability.cancel(),
  })

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-7 max-lg:gap-8">
      <h2 id={headingId} className="text-base font-bold text-foreground">
        Perfil do colecionador
      </h2>

      <div className="grid gap-7 max-lg:gap-4 lg:grid-cols-2">
        <FormField
          label="Nome de exibição"
          required
          className="gap-[15px] max-lg:gap-2"
          error={errors.displayName?.message ?? serverErrors.displayName}
        >
          {(field) => (
            <Input
              {...field}
              {...register('displayName')}
              autoComplete="nickname"
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <FormField
          label="Nome de usuário"
          required
          className="gap-[15px] max-lg:gap-2"
          error={errors.username?.message ?? serverErrors.username}
          adornment={
            usernameAvailability.status === 'checking' ? (
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin text-tan" />
            ) : undefined
          }
        >
          {(field) => (
            <Input
              {...field}
              {...usernameField}
              autoComplete="username"
              aria-busy={usernameAvailability.status === 'checking' || undefined}
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <FormField
          label="E-mail"
          required
          className="gap-[15px] max-lg:gap-2"
          error={errors.email?.message ?? serverErrors.email}
          adornment={
            emailAvailability.status === 'checking' ? (
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin text-tan" />
            ) : undefined
          }
        >
          {(field) => (
            <Input
              {...field}
              {...emailField}
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-busy={emailAvailability.status === 'checking' || undefined}
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <FormField
          label="Nome ENS"
          className="gap-[15px] max-lg:gap-2"
          error={errors.ensLabel?.message ?? serverErrors.ensLabel}
        >
          {(field) => (
            <Controller
              name="ensLabel"
              control={control}
              render={({ field: ens }) => (
                <EnsInput
                  field={field}
                  name={ens.name}
                  value={ens.value}
                  onChange={ens.onChange}
                  onBlur={ens.onBlur}
                />
              )}
            />
          )}
        </FormField>

        <FormField
          label="Apelido da carteira"
          className="gap-[15px] max-lg:gap-2"
          error={errors.walletNickname?.message ?? serverErrors.walletNickname}
        >
          {(field) => (
            <Input
              {...field}
              {...register('walletNickname')}
              autoComplete="off"
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <div className="flex flex-col">{avatarSlot}</div>
      </div>

      {formMessage && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{formMessage}</span>
        </p>
      )}
    </section>
  )
}
