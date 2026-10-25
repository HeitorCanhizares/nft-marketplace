import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandlerConnection } from 'msw'
import type { Edition } from '../../types/nft'
import type { OrderStatus } from '../../types/order'
import { mockConfig } from '../scenarios/config'

export type NftPriceChangedPayload = {
  nftId: string
  editionId: string
  price: string
  previousPrice: string
}

export type NftStockChangedPayload = {
  nftId: string
  editionId: string
  available: Edition['available']
}

export type OrderUpdatedPayload = {
  orderId: string
  status: OrderStatus
  txHash?: string
  declineReason?: string
}

export type NftRealtimeEvents = {
  'nft:price_changed': NftPriceChangedPayload
  'nft:stock_changed': NftStockChangedPayload
}

type Subscriptions = {
  nftIds: Set<string>
  orderIds: Set<string>
}

type ConnectionState = {
  io: ReturnType<typeof toSocketIo>
  subscriptions: Subscriptions
  keepAlive: ReturnType<typeof setInterval>
}

type Client = WebSocketHandlerConnection['client']

const SOCKET_IO_PATH = '/socket.io/'

// O binding não envia pings do Engine.IO. Sem um ping por intervalo, o socket.io-client
// encerra a conexão por "ping timeout" em cerca de 30 s.
const PING_INTERVAL_MS = 20_000

const connections = new Map<Client, ConnectionState>()
let rejectNewUntil = 0

const realtimeLink = ws.link('*')

function readIds(payload: unknown): string[] {
  if (typeof payload !== 'object' || payload === null || !('ids' in payload)) {
    return []
  }
  if (!Array.isArray(payload.ids)) {
    return []
  }
  return payload.ids.filter((id): id is string => typeof id === 'string')
}

function readOrderId(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null || !('orderId' in payload)) {
    return undefined
  }
  return typeof payload.orderId === 'string' ? payload.orderId : undefined
}

function forget(client: Client): void {
  const state = connections.get(client)
  if (state === undefined) {
    return
  }
  clearInterval(state.keepAlive)
  connections.delete(client)
}

function handleConnection(connection: WebSocketHandlerConnection): void {
  const { client } = connection
  if (client.url.pathname !== SOCKET_IO_PATH) {
    return
  }
  if (Date.now() < rejectNewUntil) {
    client.close()
    return
  }

  const io = toSocketIo(connection)
  const state: ConnectionState = {
    io,
    subscriptions: { nftIds: new Set(), orderIds: new Set() },
    keepAlive: setInterval(() => client.send('2'), PING_INTERVAL_MS),
  }
  connections.set(client, state)

  io.client.on('nft:subscribe', (_event, payload) => {
    for (const id of readIds(payload)) {
      state.subscriptions.nftIds.add(id)
    }
  })
  io.client.on('nft:unsubscribe', (_event, payload) => {
    for (const id of readIds(payload)) {
      state.subscriptions.nftIds.delete(id)
    }
  })
  io.client.on('order:subscribe', (_event, payload) => {
    const orderId = readOrderId(payload)
    if (orderId !== undefined) {
      state.subscriptions.orderIds.add(orderId)
    }
  })

  client.addEventListener('close', () => forget(client))
}

export function emitToNftSubscribers<E extends keyof NftRealtimeEvents>(
  event: E,
  payload: NftRealtimeEvents[E],
): void {
  if (!mockConfig.realtimeEnabled) {
    return
  }
  for (const state of connections.values()) {
    if (state.subscriptions.nftIds.has(payload.nftId)) {
      state.io.client.emit(event, payload)
    }
  }
}

// Uniões dos NFTs inscritos em todas as conexões abertas (sem repetição).
export function getSubscribedNftIds(): string[] {
  const ids = new Set<string>()
  for (const state of connections.values()) {
    for (const id of state.subscriptions.nftIds) {
      ids.add(id)
    }
  }
  return [...ids]
}

export function emitOrderUpdated(
  orderId: string,
  payload: Omit<OrderUpdatedPayload, 'orderId'>,
): void {
  if (!mockConfig.realtimeEnabled) {
    return
  }
  for (const state of connections.values()) {
    if (state.subscriptions.orderIds.has(orderId)) {
      state.io.client.emit('order:updated', { orderId, ...payload })
    }
  }
}

// session:expired não é de um NFT nem de um pedido, então vai para todas as conexões abertas.
export function emitSessionExpired(): void {
  if (!mockConfig.realtimeEnabled) {
    return
  }
  for (const state of connections.values()) {
    state.io.client.emit('session:expired', {})
  }
}

// Derruba as conexões abertas e recusa novas por `forMs` ms, para o polling assumir.
export function dropConnections(forMs: number): void {
  rejectNewUntil = Date.now() + forMs
  for (const [client, state] of [...connections]) {
    clearInterval(state.keepAlive)
    connections.delete(client)
    client.close()
  }
}

export const realtimeHandlers = [realtimeLink.addEventListener('connection', handleConnection)]
