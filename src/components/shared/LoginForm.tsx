import { useCallback, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon } from 'lucide-react'

import { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from '@/components/shared/authStyles'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { RetryCountdown } from '@/components/shared/RetryCountdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginFormSchema, type LoginFormValues } from '@/schemas/auth'
import { isApiError } from '@/services/http/ApiError'
import { cn } from '@/lib/utils'

type LoginFormProps = {
  variant: 'desktop' | 'mobile'
  onSubmit: (values: LoginFormValues) => Promise<void>
  defaultEmail?: string
  className?: string
}

const DEFAULT_RETRY_SECONDS = 30
const NETWORK_MESSAGE = 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.'
const GENERIC_MESSAGE = 'Não foi possível concluir a ação. Tente novamente.'

type FormError = { message: string; retry: boolean }
type LoginFieldKey = 'email' | 'password'
type Countdown = { seconds: number; key: number }

export function LoginForm({ variant, onSubmit, defaultEmail, className }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    defaultValues: { email: defaultEmail ?? '', password: '' },
  })
  const { register } = form
  const { errors } = form.formState

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<FormError | null>(null)
  const [countdown, setCountdown] = useState<Countdown | null>(null)
  // Erros do servidor ficam fora do react-hook-form: ele os apaga ao sair do campo.
  const [serverErrors, setServerErrors] = useState<Partial<Record<LoginFieldKey, string>>>({})
  // Ref além do estado: duplo clique no mesmo frame não passa pelo re-render.
  const submittingRef = useRef(false)
  const lastValuesRef = useRef<LoginFormValues | null>(null)

  const busy = submitting || countdown !== null

  const handleFinish = useCallback(() => setCountdown(null), [])

  function handleError(error: unknown) {
    if (!isApiError(error)) {
      setFormError({ message: GENERIC_MESSAGE, retry: false })
      return
    }

    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        setFormError({ message: 'E-mail ou senha incorretos', retry: false })
        form.resetField('password')
        form.setFocus('password')
        return

      case 'TOO_MANY_ATTEMPTS': {
        const retryAfter = error.details?.retryAfterSeconds
        const seconds =
          typeof retryAfter === 'number' && retryAfter > 0 ? retryAfter : DEFAULT_RETRY_SECONDS
        setFormError(null)
        form.resetField('password')
        setCountdown((current) => ({ seconds, key: (current?.key ?? 0) + 1 }))
        return
      }

      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        setFormError({ message: NETWORK_MESSAGE, retry: true })
        return

      case 'VALIDATION_ERROR': {
        const fields = error.fields ?? {}
        const knownKeys = (['email', 'password'] as const).filter((key) => fields[key])
        if (knownKeys.length === 0) {
          setFormError({ message: 'Revise os dados informados.', retry: false })
          return
        }
        setServerErrors(Object.fromEntries(knownKeys.map((key) => [key, fields[key]])))
        form.setFocus(knownKeys[0])
        return
      }

      default:
        if (error.status >= 500) {
          setFormError({ message: NETWORK_MESSAGE, retry: true })
          return
        }
        setFormError({ message: error.message, retry: false })
    }
  }

  async function submit(values: LoginFormValues) {
    if (submittingRef.current || countdown !== null) return

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)
    setServerErrors({})
    lastValuesRef.current = values

    try {
      await onSubmit(values)
    } catch (error) {
      handleError(error)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function clearServerError(field: LoginFieldKey) {
    setServerErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    )
  }

  function retry() {
    const values = lastValuesRef.current
    if (values) void submit(values)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(submit)(event)
  }

  const emailField = register('email', {
    onChange: () => {
      setFormError(null)
      clearServerError('email')
    },
  })
  const passwordField = register('password', {
    onChange: () => {
      setFormError(null)
      clearServerError('password')
    },
  })

  return (
    <form noValidate onSubmit={handleFormSubmit} className={cn('flex flex-col', className)}>
      {countdown && (
        <RetryCountdown
          key={countdown.key}
          seconds={countdown.seconds}
          onFinish={handleFinish}
          className="mb-4"
        />
      )}
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <span>{formError.message}</span>
            {formError.retry && (
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
          label="E-mail"
          hideLabel
          required
          error={errors.email?.message ?? serverErrors.email}
        >
          {(field) => (
            <Input
              {...field}
              {...emailField}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="contato@email.com"
              required
              className={AUTH_INPUT_CLASS}
            />
          )}
        </FormField>

        <FormField
          label="Senha"
          hideLabel
          required
          error={errors.password?.message ?? serverErrors.password}
        >
          {(field) => (
            <PasswordInput
              {...field}
              {...passwordField}
              autoComplete="current-password"
              placeholder="Senha"
              required
            />
          )}
        </FormField>
      </div>

      <ComingSoon className="mt-2 self-end text-sm leading-5 text-price">
        Esqueceu a senha?
      </ComingSoon>

      <Button
        type="submit"
        aria-busy={submitting || undefined}
        aria-disabled={busy ? 'true' : undefined}
        className={cn(AUTH_SUBMIT_CLASS, variant === 'mobile' ? 'mt-10' : 'mt-6')}
      >
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
