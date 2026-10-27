import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useDebounce } from '@/hooks/useDebounce'
import { useDeferredEmptyValidation } from '@/hooks/useDeferredEmptyValidation'
import { toCollector, toSecondaryBody } from '@/lib/checkoutCollector'
import { readDraft, writeDraft } from '@/lib/checkoutStorage'
import { checkoutNoteSchema, type CheckoutDraft, type CheckoutMode } from '@/schemas/checkout'
import { networkSchema } from '@/schemas/common'
import {
  checkoutWalletFormSchema,
  toWalletFormValues,
  type WalletBody,
  type WalletFormValues,
} from '@/schemas/wallet'
import type { Network, WalletProvider } from '@/types/nft'
import type { CreateOrderInput } from '@/types/order'
import type { User, WalletsResponse } from '@/types/user'

// Ordem visual dos campos: o foco vai para o primeiro com erro.
const FOCUS_ORDER = [
  'displayName',
  'username',
  'network',
  'profileName',
  'address',
  'secondaryAddressOrEns',
  'provider',
  'referralCode',
  'email',
  'ensLabel',
] as const satisfies readonly (keyof WalletFormValues)[]

type ServerErrors = Partial<Record<keyof WalletFormValues, string>>

export type CheckoutCollected = {
  collector: CreateOrderInput['collector']
  values: WalletFormValues
  note?: string
  walletId?: string
  saveAsSecondary: boolean
  secondaryBody?: WalletBody
}

function parseNetwork(value: string): Network | null {
  const result = networkSchema.safeParse(value)
  return result.success ? result.data : null
}

// Valores de cada modo. "primary" sem principal pré-preenche com os dados do perfil.
function valuesFor(mode: CheckoutMode, wallets: WalletsResponse, user: User): WalletFormValues {
  if (mode === 'primary') return toWalletFormValues(wallets.primary, user)
  if (mode === 'secondary') return toWalletFormValues(wallets.secondary, null)
  return toWalletFormValues(null, null)
}

type InitialState = {
  mode: CheckoutMode
  values: WalletFormValues
  note: string
  saveAsSecondary: boolean
  provider: WalletProvider | null
}

// Rascunho do mesmo usuário, se o modo ainda for possível; senão volta à principal.
function resolveInitial(wallets: WalletsResponse, user: User): InitialState {
  const draft = readDraft(user.id)
  if (draft !== null && (draft.mode !== 'secondary' || wallets.secondary !== null)) {
    return {
      mode: draft.mode,
      values: draft.values,
      note: draft.note,
      saveAsSecondary: draft.mode === 'manual' && draft.saveAsSecondary,
      provider: draft.provider,
    }
  }

  const values = toWalletFormValues(wallets.primary, user)
  return {
    mode: 'primary',
    values,
    note: draft?.note ?? '',
    saveAsSecondary: false,
    provider: draft?.provider ?? null,
  }
}

// Estado do formulário do Pagamento: desktop (WalletForm) e mobile (carteira escolhida).
export function useCheckoutForm(wallets: WalletsResponse, user: User) {
  const [initial] = useState(() => resolveInitial(wallets, user))

  const [resolver, markSubmitAttempt] = useDeferredEmptyValidation<WalletFormValues>(
    zodResolver(checkoutWalletFormSchema),
  )
  const form = useForm<WalletFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: initial.values,
  })

  const [mode, setModeState] = useState<CheckoutMode>(initial.mode)
  const [saveAsSecondaryOn, setSaveAsSecondaryOn] = useState(initial.saveAsSecondary)
  const [note, setNote] = useState(initial.note)
  const [provider, setProviderState] = useState<WalletProvider | null>(initial.provider)
  const [serverErrors, setServerErrors] = useState<ServerErrors>({})

  // Descarte depois do pedido criado: lido só dentro de efeitos, nunca no render.
  const discarded = useRef(false)

  const hasPrimary = wallets.primary !== null
  const hasSecondary = wallets.secondary !== null
  const useOther = mode !== 'primary'
  const saveAsSecondary = mode === 'manual' && saveAsSecondaryOn

  const network = parseNetwork(useWatch({ control: form.control, name: 'network' }))

  const noteResult = checkoutNoteSchema.safeParse(note)
  const noteError = noteResult.success ? null : (noteResult.error.issues[0]?.message ?? null)

  // Rascunho: grava com debounce a cada alteração e na desmontagem (a última digitação não se perde).
  // A assinatura é string, então o debounce não entra em loop de re-render.
  const watchedSignature = JSON.stringify(useWatch({ control: form.control }))
  const debouncedSignature = useDebounce(watchedSignature, 400)

  const latest = useRef({ userId: user.id, mode, saveAsSecondary, note, provider })
  useEffect(() => {
    latest.current = { userId: user.id, mode, saveAsSecondary, note, provider }
  })

  useEffect(() => {
    if (discarded.current) return
    writeDraft({ ...latest.current, values: form.getValues() })
  }, [debouncedSignature, mode, saveAsSecondary, note, provider, form])

  useEffect(
    () => () => {
      if (discarded.current) return
      const draft: CheckoutDraft = { ...latest.current, values: form.getValues() }
      writeDraft(draft)
    },
    [form],
  )

  // Troca de modo: reaplica os valores do modo e limpa erros do servidor e a opção de salvar.
  // O provedor escolhido é independente do campo "Tipo de carteira" e não muda aqui.
  function applyMode(next: CheckoutMode) {
    const values = valuesFor(next, wallets, user)
    form.reset(values)
    setModeState(next)
    setSaveAsSecondaryOn(false)
    setServerErrors({})
  }

  function setUseOther(on: boolean) {
    if (on) {
      applyMode(hasSecondary ? 'secondary' : 'manual')
      return
    }
    applyMode('primary')
  }

  function setMode(next: CheckoutMode) {
    if (next === 'secondary' && !hasSecondary) return
    applyMode(next)
  }

  function setSaveAsSecondary(on: boolean) {
    setSaveAsSecondaryOn(on)
  }

  function setProvider(next: WalletProvider | null) {
    setProviderState(next)
  }

  function savedWalletId(): string | undefined {
    if (mode === 'primary') return wallets.primary?.id
    if (mode === 'secondary') return wallets.secondary?.id
    return undefined
  }

  // Valida tudo no envio. Inválido: foca o primeiro campo com erro e devolve null.
  async function collect(): Promise<CheckoutCollected | null> {
    markSubmitAttempt()
    const valid = await form.trigger()
    if (!valid) {
      const first = FOCUS_ORDER.find((name) => form.getFieldState(name).error !== undefined)
      if (first !== undefined) form.setFocus(first)
      return null
    }
    if (!noteResult.success) return null

    const values = form.getValues()
    return {
      collector: toCollector(values),
      values,
      note: note.trim() || undefined,
      walletId: savedWalletId(),
      saveAsSecondary,
      secondaryBody: saveAsSecondary ? toSecondaryBody(values) : undefined,
    }
  }

  // Pedido criado: para de regravar o rascunho, mas não o apaga. Ele só sai quando o pedido
  // confirma (useOrderOutcome); na recusa, "Tentar novamente" volta ao Pagamento preenchido.
  function discardDraft() {
    discarded.current = true
  }

  return {
    form,
    serverErrors,
    setServerErrors,
    mode,
    setMode,
    useOther,
    setUseOther,
    saveAsSecondary,
    setSaveAsSecondary,
    replacesSecondary: hasSecondary,
    note,
    setNote,
    noteError,
    provider,
    setProvider,
    network,
    hasPrimary,
    hasSecondary,
    collect,
    discardDraft,
  }
}
