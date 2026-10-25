import type { Network, WalletProvider } from './nft'

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'rejected'

export type WalletConnection = {
  address: string
  network: Network
  provider: WalletProvider
}

export type WalletErrorCode = 'USER_REJECTED' | 'WRONG_NETWORK' | 'SIGN_REJECTED' | 'DISCONNECTED'

export type WalletError = {
  code: WalletErrorCode
}

export type WalletEvents = {
  accountsChanged: string[]
  chainChanged: Network
  disconnect: WalletError
}

export type WalletEventName = keyof WalletEvents

export type WalletProviderApi = {
  connect: (provider: WalletProvider, network: Network) => Promise<WalletConnection>
  disconnect: () => Promise<void>
  switchNetwork: (network: Network) => Promise<void>
  signOrder: (orderRef: string) => Promise<void>
  on: <E extends WalletEventName>(
    event: E,
    handler: (payload: WalletEvents[E]) => void,
  ) => () => void
}
