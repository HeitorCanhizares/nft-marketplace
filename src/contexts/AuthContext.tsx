import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  AuthContext,
  type AuthContextValue,
  type AuthResponse,
  type AuthState,
} from '@/contexts/auth'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import type { LoginInput, RegisterInput } from '@/services/api/auth'
import {
  getSession,
  login,
  logout,
  refreshSession as refreshSessionRequest,
  register,
} from '@/services/api/auth'
import { isApiError } from '@/services/http/ApiError'
import { onSessionExpired } from '@/services/http/sessionEvents'
import { reconnectSocket } from '@/services/realtime/socket'
import {
  clearSession,
  msUntilExpiry,
  msUntilWarning,
  readSession,
  writeSession,
} from '@/lib/session'

type AuthProviderProps = {
  children: ReactNode
  // Injetado por app/Providers.tsx: limpa cache privado, inscrições do socket, carteira e rascunhos.
  onClearPrivateSession: () => void
  // Opcional: chamado depois que a sessão expira. O redirecionamento é da fase 05 (roteador).
  onExpired?: () => void
}

const ANONYMOUS_STATE: AuthState = {
  status: 'anonymous',
  user: null,
  expiresAt: null,
  expiryWarning: false,
}

type ReadyStatus = 'authenticated' | 'anonymous'

// Promessa de inicialização com o `resolve` guardado junto. Criada uma vez por provider.
function createReadyGate(): {
  promise: Promise<ReadyStatus>
  settle: (status: ReadyStatus) => void
} {
  let settle: (status: ReadyStatus) => void = () => undefined
  const promise = new Promise<ReadyStatus>((resolve) => {
    settle = resolve
  })
  return { promise, settle }
}

// Com sessão salva, começa em `loading` até o GET /auth/session responder.
// Lazy init: a leitura do localStorage roda uma vez, na montagem.
function initialAuthState(): AuthState {
  if (readSession() === null) return ANONYMOUS_STATE
  return { ...ANONYMOUS_STATE, status: 'loading' }
}

export function AuthProvider({ children, onClearPrivateSession, onExpired }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialAuthState)
  const { announce } = useLiveAnnouncer()

  // Uma única promessa por provider, com identidade estável entre renders.
  const [readyGate] = useState(createReadyGate)

  // Último usuário autenticado. Guardado em ref: não dispara render e sobrevive à expiração,
  // para que um login de outro usuário depois da expiração ainda limpe os dados privados.
  const lastUserId = useRef<string | null>(null)

  // Callbacks lidos pelas ações e pelos timers. Atualizados depois de cada render,
  // assim as ações mantêm identidade estável mesmo que o pai passe funções novas.
  const latest = useRef({ onClearPrivateSession, onExpired })
  useEffect(() => {
    latest.current = { onClearPrivateSession, onExpired }
  })

  // Status atual para o listener de expiração (ele não pode ler o state diretamente).
  const statusRef = useRef<AuthState['status']>(state.status)
  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  const { status, expiresAt } = state

  // (a) Inicialização: recupera a sessão salva. Sem sessão, o estado já é `anonymous`.
  useEffect(() => {
    const saved = readSession()
    if (saved === null) {
      readyGate.settle('anonymous')
      return
    }

    const controller = new AbortController()

    getSession(controller.signal).then(
      (response) => {
        writeSession({ token: saved.token, expiresAt: response.expiresAt })
        lastUserId.current = response.user.id
        setState({
          status: 'authenticated',
          user: response.user,
          expiresAt: response.expiresAt,
          expiryWarning: false,
        })
        readyGate.settle('authenticated')
      },
      (error: unknown) => {
        // Cancelado (cleanup do StrictMode): não resolve; o efeito seguinte resolve.
        if (controller.signal.aborted) return

        // Token vencido ou inválido: apaga a sessão. Erro de rede/5xx: mantém o token.
        if (isApiError(error) && error.status === 401) {
          clearSession()
        }
        setState(ANONYMOUS_STATE)
        readyGate.settle('anonymous')
      },
    )

    return () => {
      controller.abort()
    }
  }, [readyGate])

  // (c) Expiração: aviso 2 minutos antes e expiração no horário de `expiresAt`.
  // Roda a cada mudança de status ou de expiresAt (login, refresh, logout) e limpa os timers.
  const expire = useCallback(() => {
    clearSession()
    // Reconecta o socket para que a conexão deixe de usar o token vencido.
    // A limpeza de dados privados não roda aqui: o rascunho do checkout precisa sobreviver.
    reconnectSocket()
    setState(ANONYMOUS_STATE)
    announce('Sua sessão expirou.', 'assertive')
    latest.current.onExpired?.()
  }, [announce])

  useEffect(() => {
    if (status !== 'authenticated' || expiresAt === null) return

    const warningTimer = window.setTimeout(() => {
      setState((prev) =>
        prev.status === 'authenticated' ? { ...prev, expiryWarning: true } : prev,
      )
    }, msUntilWarning(expiresAt))

    const expiryTimer = window.setTimeout(expire, msUntilExpiry(expiresAt))

    return () => {
      window.clearTimeout(warningTimer)
      window.clearTimeout(expiryTimer)
    }
  }, [status, expiresAt, expire])

  // (d) Expiração sinalizada pelo servidor (401 SESSION_EXPIRED ou evento do socket).
  useEffect(() => {
    return onSessionExpired(() => {
      if (statusRef.current === 'authenticated') {
        expire()
      }
    })
  }, [expire])

  // Aplica uma sessão nova vinda de login ou cadastro. Limpa os dados privados se o usuário mudou.
  const applyNewSession = useCallback((response: AuthResponse) => {
    const previousUserId = lastUserId.current
    if (previousUserId !== null && previousUserId !== response.user.id) {
      latest.current.onClearPrivateSession()
    }

    writeSession(response.session)
    lastUserId.current = response.user.id
    setState({
      status: 'authenticated',
      user: response.user,
      expiresAt: response.session.expiresAt,
      expiryWarning: false,
    })
    reconnectSocket()
  }, [])

  // (b) Ações.
  const signIn = useCallback(
    async (credentials: LoginInput): Promise<AuthResponse> => {
      const response = await login(credentials)
      applyNewSession(response)
      return response
    },
    [applyNewSession],
  )

  const signUp = useCallback(
    async (data: RegisterInput): Promise<AuthResponse> => {
      const response = await register(data)
      applyNewSession(response)
      return response
    },
    [applyNewSession],
  )

  const signOut = useCallback(async (): Promise<void> => {
    // A falha no servidor não impede o logout local. O token ainda é necessário para a chamada.
    try {
      await logout()
    } catch {
      // Ignorada de propósito: a sessão local é apagada de qualquer forma.
    }

    clearSession()
    latest.current.onClearPrivateSession()
    lastUserId.current = null
    setState(ANONYMOUS_STATE)
    announce('Você saiu da sua conta', 'polite')
  }, [announce])

  const refreshSession = useCallback(async (): Promise<void> => {
    const response = await refreshSessionRequest()
    writeSession(response.session)
    // Troca a expiração e desarma o aviso. O efeito de expiração é refeito pelo novo expiresAt.
    setState((prev) =>
      prev.status === 'authenticated'
        ? { ...prev, expiresAt: response.session.expiresAt, expiryWarning: false }
        : prev,
    )
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      ready: readyGate.promise,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [state, readyGate, signIn, signUp, signOut, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
