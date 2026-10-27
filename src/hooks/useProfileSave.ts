import { toast } from 'sonner'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { useChangePassword } from '@/hooks/useChangePassword'
import { useUpdateProfile } from '@/hooks/useProfile'
import { toEnsName, type ProfileBody, type ProfileFormValues } from '@/schemas/profile'
import { isApiError } from '@/services/http/ApiError'

export type SaveBlockError = {
  code: string | null
  message: string
  fields: Record<string, string>
}

export type SaveBlockResult = 'skipped' | 'ok' | SaveBlockError

export type ProfileSaveResult = { profile: SaveBlockResult; password: SaveBlockResult }

export type ProfileSaveInput = {
  values: ProfileFormValues
  changed: { data: boolean; password: boolean }
  emailPassword?: string // senha digitada no diálogo; só quando o e-mail mudou
}

const GENERIC_SAVE_ERROR = 'Não foi possível salvar. Verifique sua conexão e tente novamente.'

// Erro de API vira o bloco com seus campos; rede, timeout, 5xx e erro desconhecido viram a mensagem genérica.
function toBlockError(error: unknown): SaveBlockError {
  if (!isApiError(error)) {
    return { code: null, message: GENERIC_SAVE_ERROR, fields: {} }
  }
  if (error.status >= 500 || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return { code: error.code, message: GENERIC_SAVE_ERROR, fields: {} }
  }
  return { code: error.code, message: error.message, fields: error.fields ?? {} }
}

function toBlockResult(outcome: PromiseSettledResult<unknown>): SaveBlockResult {
  return outcome.status === 'fulfilled' ? 'ok' : toBlockError(outcome.reason)
}

function buildProfileBody(values: ProfileFormValues, emailPassword?: string): ProfileBody {
  return {
    displayName: values.displayName,
    username: values.username,
    email: values.email,
    ensName: toEnsName(values.ensLabel),
    walletNickname: values.walletNickname,
    ...(emailPassword ? { currentPassword: emailPassword } : {}),
  }
}

// Dados e senha são envios independentes: um erro não cancela nem desfaz o outro.
export function useProfileSave() {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { announce } = useLiveAnnouncer()

  async function save(input: ProfileSaveInput): Promise<ProfileSaveResult> {
    const { values, changed, emailPassword } = input

    const profileTask = changed.data
      ? updateProfile.mutateAsync(buildProfileBody(values, emailPassword))
      : null
    const passwordTask = changed.password
      ? changePassword.mutateAsync({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      : null

    const [profileOutcome, passwordOutcome] = await Promise.allSettled([
      profileTask ?? Promise.resolve(),
      passwordTask ?? Promise.resolve(),
    ])

    const profile: SaveBlockResult =
      profileTask === null ? 'skipped' : toBlockResult(profileOutcome)
    const password: SaveBlockResult =
      passwordTask === null ? 'skipped' : toBlockResult(passwordOutcome)

    if (profile === 'ok') {
      toast.success('Perfil atualizado')
      announce('Perfil atualizado', 'polite')
    } else if (profile !== 'skipped') {
      announce(profile.message, 'assertive')
    }

    if (password === 'ok') {
      toast.success('Senha alterada')
      announce('Senha alterada', 'polite')
    } else if (password !== 'skipped') {
      announce(password.message, 'assertive')
    }

    return { profile, password }
  }

  return {
    save,
    isSaving: updateProfile.isPending || changePassword.isPending,
  }
}
