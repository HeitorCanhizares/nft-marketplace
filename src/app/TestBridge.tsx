import { useEffect, useRef, type MutableRefObject } from 'react'
import { toast } from 'sonner'

import { clearPrivateSession } from '@/app/clearPrivateSession'
import { queryClient } from '@/app/queryClient'
import { useAuth, type AuthContextValue, type AuthState } from '@/contexts/auth'
import { useLiveAnnouncer, type LiveAnnouncerContextValue } from '@/contexts/liveAnnouncer'
import * as queryKeys from '@/hooks/queryKeys'
import {
  useWalletConnection,
  type UseWalletConnectionResult,
  type WalletConnectionState,
} from '@/hooks/useWalletConnection'
import * as address from '@/lib/address'
import * as session from '@/lib/session'
import * as apiSchemas from '@/schemas/api'
import * as cartSchemas from '@/schemas/cart'
import * as commonSchemas from '@/schemas/common'
import * as nftSchemas from '@/schemas/nft'
import * as orderSchemas from '@/schemas/order'
import * as userSchemas from '@/schemas/user'
import { ApiError, isApiError, isRetryable, toApiError } from '@/services/http/ApiError'
import { HTTP_TIMEOUT_MS, http } from '@/services/http/client'
import { emitSessionExpired, onSessionExpired } from '@/services/http/sessionEvents'
import { validate } from '@/services/http/validate'
import * as socket from '@/services/realtime/socket'
import * as walletRegistry from '@/services/wallet'

// Ponte de teste: só existe no build de MODE test (ver Providers.tsx). Não tem UI.

type TestAuthApi = {
  readonly state: AuthState
  signIn: AuthContextValue['signIn']
  signUp: AuthContextValue['signUp']
  signOut: AuthContextValue['signOut']
  refreshSession: AuthContextValue['refreshSession']
}

type TestWalletApi = {
  readonly state: WalletConnectionState
  connect: UseWalletConnectionResult['connect']
  disconnect: UseWalletConnectionResult['disconnect']
  switchNetwork: UseWalletConnectionResult['switchNetwork']
}

type KurioTestApi = {
  auth: TestAuthApi
  announce: LiveAnnouncerContextValue['announce']
  toast: typeof toast
  queryClient: typeof queryClient
  http: typeof http
  HTTP_TIMEOUT_MS: typeof HTTP_TIMEOUT_MS
  ApiError: typeof ApiError
  isApiError: typeof isApiError
  toApiError: typeof toApiError
  isRetryable: typeof isRetryable
  onSessionExpired: typeof onSessionExpired
  emitSessionExpired: typeof emitSessionExpired
  validate: typeof validate
  queryKeys: typeof queryKeys
  socket: typeof socket
  session: typeof session
  address: typeof address
  schemas: {
    api: typeof apiSchemas
    cart: typeof cartSchemas
    common: typeof commonSchemas
    nft: typeof nftSchemas
    order: typeof orderSchemas
    user: typeof userSchemas
  }
  clearPrivateSession: () => Promise<void>
  walletRegistry: typeof walletRegistry
  wallet: TestWalletApi
}

declare global {
  interface Window {
    __kurio?: KurioTestApi
  }
}

// Sonda: monta o useWalletConnection (hook é por componente) e espelha o resultado em ref.
function WalletProbe({
  walletRef,
}: {
  walletRef: MutableRefObject<UseWalletConnectionResult | null>
}) {
  const wallet = useWalletConnection()

  useEffect(() => {
    walletRef.current = wallet
  })

  return null
}

function currentWallet(target: MutableRefObject<UseWalletConnectionResult | null>) {
  if (target.current === null) {
    throw new Error('Carteira de teste ainda não montada.')
  }

  return target.current
}

export default function TestBridge() {
  const auth = useAuth()
  const { announce } = useLiveAnnouncer()

  // Espelhos lidos pelos getters do window. Atualizados depois de cada render, nunca durante o render.
  const latestAuth = useRef<AuthContextValue>(auth)
  const latestWallet = useRef<UseWalletConnectionResult | null>(null)

  useEffect(() => {
    latestAuth.current = auth
  })

  useEffect(() => {
    const api: KurioTestApi = {
      auth: {
        get state(): AuthState {
          const { status, user, expiresAt, expiryWarning } = latestAuth.current
          return { status, user, expiresAt, expiryWarning }
        },
        signIn: (credentials) => latestAuth.current.signIn(credentials),
        signUp: (data) => latestAuth.current.signUp(data),
        signOut: () => latestAuth.current.signOut(),
        refreshSession: () => latestAuth.current.refreshSession(),
      },
      announce,
      toast,
      queryClient,
      http,
      HTTP_TIMEOUT_MS,
      ApiError,
      isApiError,
      toApiError,
      isRetryable,
      onSessionExpired,
      emitSessionExpired,
      validate,
      queryKeys,
      socket,
      session,
      address,
      schemas: {
        api: apiSchemas,
        cart: cartSchemas,
        common: commonSchemas,
        nft: nftSchemas,
        order: orderSchemas,
        user: userSchemas,
      },
      clearPrivateSession: () => clearPrivateSession(queryClient),
      walletRegistry,
      wallet: {
        get state(): WalletConnectionState {
          const {
            status,
            address: walletAddress,
            network,
            provider,
            error,
          } = currentWallet(latestWallet)
          return { status, address: walletAddress, network, provider, error }
        },
        connect: (provider, network) => currentWallet(latestWallet).connect(provider, network),
        disconnect: () => currentWallet(latestWallet).disconnect(),
        switchNetwork: (network) => currentWallet(latestWallet).switchNetwork(network),
      },
    }

    window.__kurio = api

    return () => {
      delete window.__kurio
    }
  }, [announce])

  return <WalletProbe walletRef={latestWallet} />
}
