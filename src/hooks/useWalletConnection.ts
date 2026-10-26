import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { isHexAddress, shortAddress } from '@/lib/address'
import { getWalletProvider } from '@/services/wallet'
import type { Network, WalletProvider } from '@/types/nft'
import type { WalletConnectionStatus, WalletErrorCode } from '@/types/wallet'

export type WalletHookError = { code: WalletErrorCode | 'UNAVAILABLE' }

export type WalletConnectionState = {
  status: WalletConnectionStatus
  address: string | null
  network: Network | null
  provider: WalletProvider | null
  error: WalletHookError | null
}

export type WalletConnectionActions = {
  connect: (provider: WalletProvider, network: Network) => Promise<void>
  disconnect: () => Promise<void>
  switchNetwork: (network: Network) => Promise<void>
}

export type UseWalletConnectionResult = WalletConnectionState & WalletConnectionActions

const INITIAL_STATE: WalletConnectionState = {
  status: 'disconnected',
  address: null,
  network: null,
  provider: null,
  error: null,
}

const PROVIDER_NAMES: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

const NETWORK_NAMES: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const WALLET_ERROR_CODES: readonly string[] = [
  'USER_REJECTED',
  'WRONG_NETWORK',
  'SIGN_REJECTED',
  'DISCONNECTED',
]

function isWalletErrorCode(value: string): value is WalletErrorCode {
  return WALLET_ERROR_CODES.includes(value)
}

// Recusa é o padrão quando a falha do provedor não traz um código conhecido.
function toWalletErrorCode(reason: unknown): WalletErrorCode {
  if (typeof reason === 'object' && reason !== null && 'code' in reason) {
    const { code } = reason
    if (typeof code === 'string' && isWalletErrorCode(code)) {
      return code
    }
  }

  return 'USER_REJECTED'
}

export function useWalletConnection(): UseWalletConnectionResult {
  const { announce } = useLiveAnnouncer()
  const [state, setState] = useState<WalletConnectionState>(INITIAL_STATE)
  // Espelho do estado para os callbacks lerem o valor atual. Escrito só em callbacks, nunca durante o render.
  const stateRef = useRef<WalletConnectionState>(INITIAL_STATE)
  const mountedRef = useRef(false)

  const commit = useCallback((next: WalletConnectionState) => {
    stateRef.current = next
    setState(next)
  }, [])

  // Assina os eventos do provedor ao montar e cancela ao desmontar. Não desconecta a carteira.
  useEffect(() => {
    mountedRef.current = true

    const applyDisconnect = (error: WalletHookError | null) => {
      const wasConnected = stateRef.current.status === 'connected'
      commit({ ...INITIAL_STATE, error })
      if (wasConnected) {
        announce('Carteira desconectada')
      }
    }

    const api = getWalletProvider()
    const unsubscribers = api
      ? [
          api.on('disconnect', (payload) => {
            applyDisconnect({ code: payload.code })
          }),
          api.on('accountsChanged', (accounts) => {
            if (stateRef.current.status !== 'connected') {
              return
            }

            // Lista vazia: a carteira não expõe mais nenhuma conta, então a conexão acabou.
            if (accounts.length === 0) {
              applyDisconnect(null)
              return
            }

            const [address] = accounts
            if (isHexAddress(address)) {
              commit({ ...stateRef.current, address })
            }
          }),
          api.on('chainChanged', (network) => {
            const current = stateRef.current
            if (current.status !== 'connected' || current.network === network) {
              return
            }

            commit({ ...current, network })
            announce(`Rede alterada para ${NETWORK_NAMES[network]}`)
          }),
        ]
      : []

    return () => {
      mountedRef.current = false
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
    }
  }, [announce, commit])

  const connect = useCallback(
    async (provider: WalletProvider, network: Network) => {
      const api = getWalletProvider()

      if (!api) {
        commit({
          status: 'rejected',
          address: null,
          network,
          provider,
          error: { code: 'UNAVAILABLE' },
        })
        announce('Carteira indisponível', 'assertive')
        return
      }

      commit({ status: 'connecting', address: null, network, provider, error: null })
      announce(`Conectando à ${PROVIDER_NAMES[provider]}...`)

      try {
        const connection = await api.connect(provider, network)
        if (!mountedRef.current) {
          return
        }

        commit({
          status: 'connected',
          address: connection.address,
          network: connection.network,
          provider: connection.provider,
          error: null,
        })
        announce(`Conectada: ${shortAddress(connection.address)}`)
      } catch (reason) {
        if (!mountedRef.current) {
          return
        }

        commit({
          status: 'rejected',
          address: null,
          network,
          provider,
          error: { code: toWalletErrorCode(reason) },
        })
        announce('Conexão recusada na carteira', 'assertive')
      }
    },
    [announce, commit],
  )

  const disconnect = useCallback(async () => {
    const api = getWalletProvider()
    if (!api) {
      return
    }

    await api.disconnect()
    if (!mountedRef.current) {
      return
    }

    // Se o provedor já emitiu disconnect, o estado já está desconectado e o aviso já saiu.
    const wasConnected = stateRef.current.status === 'connected'
    commit({ ...INITIAL_STATE })
    if (wasConnected) {
      announce('Carteira desconectada')
    }
  }, [announce, commit])

  const switchNetwork = useCallback(
    async (network: Network) => {
      const api = getWalletProvider()
      if (!api || stateRef.current.status !== 'connected') {
        return
      }

      await api.switchNetwork(network)
      if (!mountedRef.current) {
        return
      }

      // Se chainChanged já atualizou a rede, o aviso já saiu.
      const current = stateRef.current
      if (current.status !== 'connected' || current.network === network) {
        return
      }

      commit({ ...current, network })
      announce(`Rede alterada para ${NETWORK_NAMES[network]}`)
    },
    [announce, commit],
  )

  return { ...state, connect, disconnect, switchNetwork }
}
