import { useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { useWalletConnection } from '@/hooks/useWalletConnection'
import type { Network, WalletProvider } from '@/types/nft'

const NETWORK_FIRST_HINT = 'Selecione uma rede antes de escolher a carteira.'

// Escolha da carteira no Pagamento. A rede é escolhida antes; o provedor vem do rascunho do checkout.
export function useCheckoutWallet(
  expectedNetwork: Network | null,
  provider: WalletProvider | null,
  setProvider: (provider: WalletProvider | null) => void,
) {
  const connection = useWalletConnection()
  const { announce } = useLiveAnnouncer()
  const [hint, setHint] = useState<string | null>(null)

  function choose(next: WalletProvider): void {
    if (expectedNetwork === null) {
      setHint(NETWORK_FIRST_HINT)
      announce(NETWORK_FIRST_HINT, 'assertive')
      return
    }

    setHint(null)
    setProvider(next)
    void connection.connect(next, expectedNetwork)
  }

  function reconnect(): void {
    if (provider === null || expectedNetwork === null) return
    void connection.connect(provider, expectedNetwork)
  }

  function switchToExpected(): void {
    if (expectedNetwork === null) return
    void connection.switchNetwork(expectedNetwork)
  }

  function changeWallet(): void {
    setProvider(null)
    void connection.disconnect()
  }

  const isMismatch =
    connection.status === 'connected' &&
    expectedNetwork !== null &&
    connection.network !== expectedNetwork
  const isReady = connection.status === 'connected' && !isMismatch

  return {
    connection,
    provider,
    hint,
    choose,
    reconnect,
    switchToExpected,
    changeWallet,
    isMismatch,
    isReady,
  }
}
