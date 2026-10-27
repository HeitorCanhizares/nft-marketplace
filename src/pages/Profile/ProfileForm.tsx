import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'

import { AvatarUploader } from '@/components/shared/AvatarUploader'
import { AUTH_SUBMIT_CLASS } from '@/components/shared/authStyles'
import { ConfirmPasswordDialog } from '@/components/shared/ConfirmPasswordDialog'
import { UnsavedChangesGuard } from '@/components/shared/UnsavedChangesGuard'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth'
import { useAvailability } from '@/hooks/useAvailability'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'
import { useProfileSave, type ProfileSaveResult } from '@/hooks/useProfileSave'
import { profileFormSchema, toProfileFormValues, type ProfileFormValues } from '@/schemas/profile'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { PasswordSection } from './PasswordSection'
import { ProfileDataSection } from './ProfileDataSection'

type ProfileFormProps = {
  user: User
}

type ServerKey =
  | 'displayName'
  | 'username'
  | 'email'
  | 'ensLabel'
  | 'walletNickname'
  | 'currentPassword'
  | 'newPassword'

type ServerErrors = Partial<Record<ServerKey, string>>

const DATA_FIELDS = ['displayName', 'username', 'email', 'ensLabel', 'walletNickname'] as const
const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmNewPassword'] as const
const SERVER_KEYS: readonly ServerKey[] = [
  'displayName',
  'username',
  'email',
  'ensLabel',
  'walletNickname',
  'currentPassword',
  'newPassword',
]

// Campo da API -> campo do formulário (ensName vira ensLabel).
const API_FIELD_TO_FORM: Record<string, ServerKey> = {
  displayName: 'displayName',
  username: 'username',
  email: 'email',
  ensName: 'ensLabel',
  walletNickname: 'walletNickname',
  currentPassword: 'currentPassword',
  newPassword: 'newPassword',
}

const PROFILE_FIELD_CODES = ['EMAIL_TAKEN', 'USERNAME_TAKEN', 'VALIDATION_ERROR']

// Formulário de perfil: um useForm para dados e senha, com envios independentes (ver useProfileSave).
export function ProfileForm({ user }: ProfileFormProps) {
  const { status } = useAuth()
  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<ProfileFormValues>(
    zodResolver(profileFormSchema),
  )
  const form = useForm<ProfileFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: toProfileFormValues(user),
  })
  const { control, getFieldState, getValues, resetField, setFocus } = form
  const { dirtyFields } = form.formState

  const usernameAvailability = useAvailability('username')
  const emailAvailability = useAvailability('email')
  const { save, isSaving } = useProfileSave()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [emailPassword, setEmailPassword] = useState('')
  const [dialogError, setDialogError] = useState<string | undefined>(undefined)
  const [serverErrors, setServerErrors] = useState<ServerErrors>({})
  const [dataMessage, setDataMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  // Trava síncrona de envio: duplo clique no mesmo frame não passa pelo re-render.
  const savingRef = useRef(false)

  const passwordValues = useWatch({ control, name: [...PASSWORD_FIELDS] })
  const dataDirty = DATA_FIELDS.some((name) => Boolean(dirtyFields[name]))
  const passwordFilled = passwordValues.some((value) => value !== '')
  const isDirty = dataDirty || passwordFilled

  // Erro do servidor some quando o usuário edita o campo correspondente.
  const serverFieldValues = useWatch({ control, name: [...SERVER_KEYS] })
  const previousServerFieldValues = useRef(serverFieldValues)
  useEffect(() => {
    const previous = previousServerFieldValues.current
    previousServerFieldValues.current = serverFieldValues
    const editedKeys = SERVER_KEYS.filter(
      (_, index) => previous[index] !== serverFieldValues[index],
    )
    if (editedKeys.length === 0) return
    setServerErrors((current) => {
      const next: ServerErrors = { ...current }
      let touched = false
      for (const key of editedKeys) {
        if (next[key] !== undefined) {
          next[key] = undefined
          touched = true
        }
      }
      return touched ? next : current
    })
  }, [serverFieldValues])

  function computeChanged(): { data: boolean; password: boolean } {
    return {
      data: DATA_FIELDS.some((name) => getFieldState(name).isDirty),
      password: PASSWORD_FIELDS.some((name) => getValues(name) !== ''),
    }
  }

  function emailChanged(email: string): boolean {
    return email.trim().toLowerCase() !== user.email.toLowerCase()
  }

  // Aplica erros de campo da API no formulário; devolve as chaves aplicadas (a primeira recebe o foco).
  function applyFieldErrors(fields: Record<string, string>): ServerKey[] {
    const next: ServerErrors = {}
    const keys: ServerKey[] = []
    for (const [apiKey, message] of Object.entries(fields)) {
      const key = API_FIELD_TO_FORM[apiKey]
      if (key === undefined) continue
      next[key] = message
      keys.push(key)
    }
    if (keys.length > 0) setServerErrors((current) => ({ ...current, ...next }))
    return keys
  }

  function handleDataResult(values: ProfileFormValues, result: ProfileSaveResult['profile']) {
    if (result === 'skipped') return

    if (result === 'ok') {
      setConfirmOpen(false)
      setEmailPassword('')
      setDialogError(undefined)
      setDataMessage(null)
      // Os valores salvos viram o padrão: "Salvar" volta ao estado sem alterações.
      for (const name of DATA_FIELDS) resetField(name, { defaultValue: values[name] })
      return
    }

    if (result.code === 'INVALID_CURRENT_PASSWORD') {
      // Diálogo continua aberto com o erro; o restante do formulário é mantido.
      setEmailPassword('')
      setDialogError(result.fields.currentPassword ?? result.message)
      setConfirmOpen(true)
      return
    }

    setConfirmOpen(false)
    setEmailPassword('')
    setDialogError(undefined)

    if (result.code !== null && PROFILE_FIELD_CODES.includes(result.code)) {
      const keys = applyFieldErrors(result.fields)
      if (keys.length > 0) {
        setFocus(keys[0])
        return
      }
    }
    setDataMessage(result.message)
  }

  function handlePasswordResult(result: ProfileSaveResult['password']) {
    if (result === 'skipped') return

    if (result === 'ok') {
      setPasswordMessage(null)
      setServerErrors((current) => ({
        ...current,
        currentPassword: undefined,
        newPassword: undefined,
      }))
      for (const name of PASSWORD_FIELDS) resetField(name, { defaultValue: '' })
      return
    }

    if (result.code === 'INVALID_CURRENT_PASSWORD') {
      setServerErrors((current) => ({
        ...current,
        currentPassword: result.fields.currentPassword ?? result.message,
      }))
      setFocus('currentPassword')
      return
    }

    if (result.code === 'VALIDATION_ERROR') {
      const keys = applyFieldErrors(result.fields)
      if (keys.length > 0) {
        setFocus(keys[0])
        return
      }
    }
    setPasswordMessage(result.message)
  }

  async function runSave(values: ProfileFormValues, password: string | undefined) {
    savingRef.current = true
    try {
      const result = await save({
        values,
        changed: computeChanged(),
        emailPassword: password,
      })
      handleDataResult(values, result.profile)
      handlePasswordResult(result.password)
    } finally {
      savingRef.current = false
    }
  }

  function onValid(values: ProfileFormValues) {
    if (savingRef.current) return
    const changed = computeChanged()
    if (!changed.data && !changed.password) return

    setServerErrors({})
    setDataMessage(null)
    setPasswordMessage(null)

    // Trocar o e-mail exige a senha atual: pede no diálogo antes de enviar.
    if (changed.data && emailChanged(values.email) && emailPassword === '') {
      setDialogError(undefined)
      setConfirmOpen(true)
      return
    }

    void runSave(values, emailPassword === '' ? undefined : emailPassword)
  }

  function handleConfirm(password: string) {
    if (savingRef.current) return
    setDialogError(undefined)
    setEmailPassword(password)
    void runSave(getValues(), password)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    markSubmitAttempt()
    void form.handleSubmit(onValid)(event)
  }

  function handleDialogOpenChange(open: boolean) {
    setConfirmOpen(open)
    if (!open) {
      setEmailPassword('')
      setDialogError(undefined)
    }
  }

  return (
    <>
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className="flex w-full flex-col gap-8 lg:w-[862px]"
      >
        <ProfileDataSection
          form={form}
          currentUser={{ username: user.username, email: user.email }}
          usernameAvailability={usernameAvailability}
          emailAvailability={emailAvailability}
          serverErrors={serverErrors}
          formMessage={dataMessage}
          avatarSlot={<AvatarUploader avatarUrl={user.avatarUrl} name={user.displayName} />}
        />

        <PasswordSection form={form} serverErrors={serverErrors} formMessage={passwordMessage} />

        <div>
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            aria-busy={isSaving || undefined}
            className={cn(AUTH_SUBMIT_CLASS, 'lg:h-10 lg:w-[131px] lg:text-sm lg:font-bold')}
          >
            {isSaving && <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>

      <UnsavedChangesGuard when={isDirty && !isSaving && status === 'authenticated'} />

      <ConfirmPasswordDialog
        open={confirmOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleConfirm}
        submitting={isSaving}
        error={dialogError}
      />
    </>
  )
}
