import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { CircleAlertIcon, Loader2Icon } from 'lucide-react'

import { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from '@/components/shared/authStyles'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { PasswordRequirements } from '@/components/shared/PasswordRequirements'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'
import { useAvailability, type AvailabilityStatus } from '@/hooks/useAvailability'
import { signupFormSchema, type SignupFormValues } from '@/schemas/auth'
import { isApiError } from '@/services/http/ApiError'
import { cn } from '@/lib/utils'

type SignupFormProps = {
  variant: 'desktop' | 'mobile'
  onSubmit: (values: SignupFormValues) => Promise<void>
  redirect?: string
  className?: string
}

type FormMessage = { message: string; retry: boolean }
type Availability = ReturnType<typeof useAvailability>
type AvailabilityFieldKey = 'username' | 'email'
type ServerFieldKey = 'username' | 'email' | 'password'

const NETWORK_MESSAGE =
  'Não foi possível criar a conta agora. Verifique sua conexão e tente novamente.'
const GENERIC_MESSAGE = 'Não foi possível concluir a ação. Tente novamente.'
const TAKEN_MESSAGE = {
  username: 'Este nome de usuário já está em uso',
  email: 'Este e-mail já está cadastrado',
} as const
const AVAILABILITY_ERROR = 'availability'

const SERVER_FIELD_KEYS: readonly ServerFieldKey[] = ['username', 'email', 'password']

function isServerFieldKey(key: string): key is ServerFieldKey {
  return (SERVER_FIELD_KEYS as readonly string[]).includes(key)
}

export function SignupForm({ variant, onSubmit, redirect, className }: SignupFormProps) {
  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<SignupFormValues>(
    zodResolver(signupFormSchema),
  )
  const form = useForm<SignupFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { register, control, setError, clearErrors, getFieldState, trigger, getValues, setFocus } =
    form
  const { errors } = form.formState

  const usernameAvailability = useAvailability('username')
  const emailAvailability = useAvailability('email')

  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null)
  const [takenEmail, setTakenEmail] = useState<string | null>(null)
  // Erros do servidor ficam fora do react-hook-form: ele os apaga ao sair do campo, e a mensagem
  // (com o link "Entrar com este e-mail" embaixo) sumiria e voltaria no meio do clique.
  const [serverErrors, setServerErrors] = useState<Partial<Record<ServerFieldKey, string>>>({})
  // Ref além do estado: duplo clique no mesmo frame não passa pelo re-render.
  const submittingRef = useRef(false)
  const lastValuesRef = useRef<SignupFormValues | null>(null)

  const password = useWatch({ control, name: 'password' })

  // Traduz a disponibilidade em erro de campo; só mexe nos erros do tipo "availability".
  const syncAvailability = useCallback(
    (field: AvailabilityFieldKey, status: AvailabilityStatus) => {
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
  function checkOnBlur(field: AvailabilityFieldKey, availability: Availability) {
    void trigger(field).then((valid) => {
      if (valid) availability.check(getValues(field))
    })
  }

  function clearServerError(field: ServerFieldKey) {
    setServerErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    )
  }

  function markTyping(field: AvailabilityFieldKey, availability: Availability) {
    availability.cancel()
    setFormMessage(null)
    clearServerError(field)
    if (field === 'email') setTakenEmail(null)
  }

  function applyServerFields(fields: Record<string, string>) {
    const knownKeys = Object.keys(fields).filter(isServerFieldKey)
    if (knownKeys.length === 0) return false

    setServerErrors(Object.fromEntries(knownKeys.map((key) => [key, fields[key]])))
    setFocus(knownKeys[0])
    return true
  }

  function handleError(error: unknown, values: SignupFormValues) {
    if (!isApiError(error)) {
      setFormMessage({ message: GENERIC_MESSAGE, retry: false })
      return
    }

    switch (error.code) {
      case 'EMAIL_TAKEN':
      case 'USERNAME_TAKEN': {
        const key: 'email' | 'username' = error.code === 'EMAIL_TAKEN' ? 'email' : 'username'
        const handled = applyServerFields(error.fields ?? {})
        if (!handled) {
          setServerErrors({ [key]: TAKEN_MESSAGE[key] })
          setFocus(key)
        }
        if (key === 'email') setTakenEmail(values.email)
        return
      }

      case 'VALIDATION_ERROR': {
        const handled = applyServerFields(error.fields ?? {})
        if (!handled) setFormMessage({ message: 'Revise os dados informados.', retry: false })
        return
      }

      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        setFormMessage({ message: NETWORK_MESSAGE, retry: true })
        return

      default:
        if (error.status >= 500) {
          setFormMessage({ message: NETWORK_MESSAGE, retry: true })
          return
        }
        setFormMessage({ message: error.message, retry: false })
    }
  }

  async function submit(values: SignupFormValues) {
    if (submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setFormMessage(null)
    setTakenEmail(null)
    setServerErrors({})
    lastValuesRef.current = values

    try {
      await onSubmit(values)
    } catch (error) {
      handleError(error, values)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function retry() {
    const values = lastValuesRef.current
    if (values) void submit(values)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    markSubmitAttempt()
    void form.handleSubmit(submit)(event)
  }

  const usernameField = register('username', {
    onBlur: () => checkOnBlur('username', usernameAvailability),
    onChange: () => markTyping('username', usernameAvailability),
  })
  const emailField = register('email', {
    onBlur: () => checkOnBlur('email', emailAvailability),
    onChange: () => markTyping('email', emailAvailability),
  })
  const passwordField = register('password', {
    onChange: () => {
      setFormMessage(null)
      clearServerError('password')
    },
  })
  const confirmField = register('confirmPassword', { onChange: () => setFormMessage(null) })

  const buttonLabel = variant === 'desktop' ? 'Criar conta' : 'Criar perfil'

  return (
    <form noValidate onSubmit={handleFormSubmit} className={cn('flex flex-col', className)}>
      {formMessage && (
        <div role="alert" className="mb-4 flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <span>{formMessage.message}</span>
            {formMessage.retry && (
              <>
                {' '}
                <Button type="button" variant="link" onClick={retry} className="text-sm">
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <FormField
          label="Nome de usuário"
          hideLabel
          required
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
              placeholder="Nome de usuário"
              required
              aria-busy={usernameAvailability.status === 'checking' || undefined}
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <FormField
          label="E-mail"
          hideLabel
          required
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
              placeholder="Digite seu e-mail"
              required
              aria-busy={emailAvailability.status === 'checking' || undefined}
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        {takenEmail !== null && (
          <Link
            to="/entrar"
            search={{ redirect }}
            state={{ email: takenEmail }}
            className="-mt-1 self-start text-sm font-bold text-foreground underline underline-offset-4"
          >
            Entrar com este e-mail
          </Link>
        )}

        <FormField
          label="Senha"
          hideLabel
          required
          error={errors.password?.message ?? serverErrors.password}
          description={<PasswordRequirements value={password} className="mt-2" />}
        >
          {(field) => (
            <PasswordInput
              {...field}
              {...passwordField}
              autoComplete="new-password"
              placeholder="Senha"
              required
            />
          )}
        </FormField>

        <FormField
          label="Confirmar senha"
          hideLabel
          required
          error={errors.confirmPassword?.message}
        >
          {(field) => (
            <PasswordInput
              {...field}
              {...confirmField}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              required
            />
          )}
        </FormField>
      </div>

      <Button
        type="submit"
        aria-busy={submitting || undefined}
        aria-disabled={submitting ? 'true' : undefined}
        className={cn(AUTH_SUBMIT_CLASS, variant === 'mobile' ? 'mt-10' : 'mt-6')}
      >
        {submitting ? 'Criando conta…' : buttonLabel}
      </Button>
    </form>
  )
}
