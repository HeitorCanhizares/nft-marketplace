import type { Network, WalletProvider } from '../../types/nft'
import type {
  WalletError,
  WalletErrorCode,
  WalletEventName,
  WalletConnection,
  WalletEvents,
  WalletProviderApi,
} from '../../types/wallet'
import { STORAGE_KEYS, storage } from '../../lib/storage'
import { hasScenario } from '../scenarios/active'
import { sessionsStore, walletsStore } from '../db/stores'

const NETWORKS = ['ethereum', 'polygon', 'solana'] as const satisfies readonly Network[]
const FICTITIOUS_ADDRESS = '0x3c8E2a94bF07d1C6e5A9f0B2d7463e18aC5f9D21'

type Listener<E extends WalletEventName> = (payload: WalletEvents[E]) => void
type Listeners = { [E in WalletEventName]: Set<Listener<E>> }

type PendingTimer = {
  timer: ReturnType<typeof setTimeout>
  onCancel: () => void
}

function walletError(code: WalletErrorCode): WalletError {
  return { code }
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

function otherNetwork(network: Network): Network {
  return NETWORKS.find((candidate) => candidate !== network) ?? network
}

async function findRegisteredAddress(provider: WalletProvider): Promise<string | null> {
  const token = storage.local.getJson<{ token: string }>(STORAGE_KEYS.session)?.token
  if (!token) return null
  const session = await sessionsStore.get(token)
  if (!session) return null
  const wallets = await walletsStore.getByUserId(session.userId)
  return wallets.find((wallet) => wallet.provider === provider)?.address ?? null
}

export function createMockWalletProvider(): WalletProviderApi {
  let connection: WalletConnection | null = null
  const listeners: Listeners = {
    accountsChanged: new Set(),
    chainChanged: new Set(),
    disconnect: new Set(),
  }
  const pending = new Set<PendingTimer>()

  function listenersFor<E extends WalletEventName>(event: E): Set<Listener<E>> {
    return listeners[event]
  }

  function emit<E extends WalletEventName>(event: E, payload: WalletEvents[E]): void {
    for (const handler of [...listenersFor(event)]) handler(payload)
  }

  // Timer guardado para ser cancelado no disconnect(); onCancel roda só nesse caso.
  function schedule(ms: number, run: () => void, onCancel: () => void = () => {}): void {
    const entry: PendingTimer = {
      timer: setTimeout(() => {
        pending.delete(entry)
        run()
      }, ms),
      onCancel,
    }
    pending.add(entry)
  }

  // Quem espera um sleep() recebe DISCONNECTED se a carteira for desconectada antes.
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      schedule(ms, resolve, () => reject(walletError('DISCONNECTED')))
    })
  }

  function cancelAll(): void {
    for (const entry of pending) {
      clearTimeout(entry.timer)
      entry.onCancel()
    }
    pending.clear()
  }

  return {
    async connect(provider, network) {
      await sleep(randomBetween(800, 1500))
      if (hasScenario('wallet-rejected')) throw walletError('USER_REJECTED')

      const connectedNetwork = hasScenario('wallet-wrong-network') ? otherNetwork(network) : network
      const address = (await findRegisteredAddress(provider)) ?? FICTITIOUS_ADDRESS

      connection = { address, network: connectedNetwork, provider }

      if (hasScenario('wallet-disconnect')) {
        schedule(randomBetween(3000, 6000), () => {
          connection = null
          emit('disconnect', walletError('DISCONNECTED'))
        })
      }

      return { ...connection }
    },

    async disconnect() {
      cancelAll()
      connection = null
      emit('disconnect', walletError('DISCONNECTED'))
    },

    async switchNetwork(network) {
      if (!connection) return
      connection = { ...connection, network }
      emit('chainChanged', network)
    },

    async signOrder() {
      if (hasScenario('wallet-sign-rejected')) throw walletError('SIGN_REJECTED')
      await sleep(randomBetween(500, 1000))
    },

    on(event, handler) {
      const set = listenersFor(event)
      set.add(handler)
      return () => {
        set.delete(handler)
      }
    },
  }
}
