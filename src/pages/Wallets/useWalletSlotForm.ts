import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAuth } from '@/contexts/auth'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'
import { useWalletMutations } from '@/hooks/useWallets'
import {
  toWalletBody,
  toWalletFormValues,
  walletsFormSchema,
  type WalletsFormValues,
} from '@/schemas/wallet'
import { isApiError } from '@/services/http/ApiError'
import type { Wallet } from '@/types/user'

type Slot = 'primary' | 'secondary'
type ServerKey = keyof WalletsFormValues
type ServerErrors = Partial<Record<ServerKey, string>>

const GENERIC_SAVE_ERROR = 'Não foi possível salvar. Verifique sua conexão e tente novamente.'

// Campo da API -> campo do formulário (ensName vira ensLabel). Campos fora daqui não são exibidos.
const API_FIELD_TO_FORM: Partial<Record<string, ServerKey>> = {
  displayName: 'displayName',
  nickname: 'nickname',
  profileName: 'profileName',
  network: 'network',
  address: 'address',
  secondaryAddressOrEns: 'secondaryAddressOrEns',
  provider: 'provider',
  referralCode: 'referralCode',
  email: 'email',
  ensName: 'ensLabel',
}

// Campos editáveis que limpam o erro do servidor (todos menos o username, que não está no formulário).
const EDITABLE_KEYS = [
  'displayName',
  'nickname',
  'profileName',
  'network',
  'address',
  'secondaryAddressOrEns',
  'provider',
  'referralCode',
  'email',
  'ensLabel',
] as const satisfies readonly ServerKey[]

export type UseWalletSlotFormOptions = { onSaved?: () => void }

// Formulário de uma carteira (principal ou secundária): valores, envio, erros da API e mensagem do topo.
export function useWalletSlotForm(
  slot: Slot,
  wallet: Wallet | null,
  options?: UseWalletSlotFormOptions,
) {
  const { user } = useAuth()
  const { savePrimary, saveSecondary, isPending } = useWalletMutations()

  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<WalletsFormValues>(
    zodResolver(walletsFormSchema),
  )
  const form = useForm<WalletsFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: toWalletFormValues(wallet, user),
  })

  const [serverErrors, setServerErrors] = useState<ServerErrors>({})
  const [message, setMessage] = useState<string | null>(null)

  // Trava síncrona de envio: duplo clique no mesmo frame não passa pelo re-render.
  const savingRef = useRef(false)

  // Último wallet/user para o reset, sem depender deles no efeito (só mudança de conteúdo reinicia).
  const latest = useRef({ wallet, user })
  useEffect(() => {
    latest.current = { wallet, user }
  })

  // Reinicia só quando a carteira muda de conteúdo (salvar, remover, trocar), não pela referência.
  const walletSignature = wallet ? JSON.stringify(wallet) : ''
  useEffect(() => {
    form.reset(toWalletFormValues(latest.current.wallet, latest.current.user))
  }, [walletSignature, form])

  // Erro do servidor e mensagem do topo somem quando o campo correspondente é editado.
  const watched = useWatch({ control: form.control, name: [...EDITABLE_KEYS] })
  const previousWatched = useRef(watched)
  useEffect(() => {
    const previous = previousWatched.current
    previousWatched.current = watched
    const edited = EDITABLE_KEYS.filter((_, index) => previous[index] !== watched[index])
    if (edited.length === 0) return
    setMessage(null)
    setServerErrors((current) => {
      const next: ServerErrors = { ...current }
      let touched = false
      for (const key of edited) {
        if (next[key] !== undefined) {
          next[key] = undefined
          touched = true
        }
      }
      return touched ? next : current
    })
  }, [watched])

  const { isDirty } = form.formState

  function handleSaveError(error: unknown) {
    if (isApiError(error) && error.code === 'VALIDATION_ERROR' && error.fields) {
      const next: ServerErrors = {}
      let first: ServerKey | undefined
      for (const [apiKey, text] of Object.entries(error.fields)) {
        const key = API_FIELD_TO_FORM[apiKey]
        if (key === undefined) continue
        next[key] = text
        first ??= key
      }
      if (first !== undefined) {
        setServerErrors(next)
        form.setFocus(first)
        return
      }
    }
    setMessage(GENERIC_SAVE_ERROR)
  }

  async function submit(): Promise<void> {
    if (savingRef.current || isPending) return
    markSubmitAttempt()

    await form.handleSubmit(async (values) => {
      savingRef.current = true
      try {
        const username = wallet?.username ?? user?.username ?? ''
        const body = toWalletBody(values, username)
        if (slot === 'primary') {
          await savePrimary(body)
        } else {
          await saveSecondary(body)
        }
        // Os valores enviados viram o novo padrão do formulário.
        form.reset(values)
        setServerErrors({})
        setMessage(null)
        options?.onSaved?.()
      } catch (error) {
        handleSaveError(error)
      } finally {
        savingRef.current = false
      }
    })()
  }

  // Valores vindos de outra carteira (ex.: "Igual à carteira principal"); mantém o padrão atual.
  function applyValues(values: WalletsFormValues) {
    form.reset(values, { keepDefaultValues: true })
  }

  function resetToWallet() {
    form.reset(toWalletFormValues(latest.current.wallet, latest.current.user))
  }

  function focusFirst() {
    form.setFocus('displayName')
  }

  return {
    form,
    serverErrors,
    message,
    isDirty,
    isSaving: isPending,
    submit,
    applyValues,
    resetToWallet,
    focusFirst,
  }
}
