import { io, type Socket } from 'socket.io-client'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { emitSessionExpired } from '@/services/http/sessionEvents'
import type { ClientToServerEvents, ServerToClientEvents } from './events'

type ReconnectHandler = () => void
type ConnectionHandler = (connected: boolean) => void

const SOCKET_URL: string | undefined = import.meta.env.VITE_SOCKET_URL || undefined

// Motivo que o socket.io-client usa quando o próprio app chama disconnect().
const CLIENT_DISCONNECT_REASON = 'io client disconnect'

function readToken(): string | undefined {
  return storage.local.getJson<{ token: string }>(STORAGE_KEYS.session)?.token
}

// Criado sem conectar: nada acontece ao importar este módulo.
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  transports: ['websocket'],
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  // Função: o token é lido a cada (re)conexão, então um login novo vale no próximo connect.
  auth: (cb) => {
    cb({ token: readToken() })
  },
})

const subscribedNftIds = new Set<string>()
const subscribedOrderIds = new Set<string>()
const reconnectHandlers = new Set<ReconnectHandler>()
const connectionHandlers = new Set<ConnectionHandler>()

// true desde uma queda até a próxima conexão bem-sucedida.
let droppedSinceLastConnect = false

function resendSubscriptions(): void {
  if (subscribedNftIds.size > 0) {
    socket.emit('nft:subscribe', { ids: [...subscribedNftIds] })
  }
  for (const orderId of subscribedOrderIds) {
    socket.emit('order:subscribe', { orderId })
  }
}

socket.on('connect', () => {
  resendSubscriptions()

  if (droppedSinceLastConnect) {
    droppedSinceLastConnect = false
    for (const handler of [...reconnectHandlers]) {
      handler()
    }
  }

  for (const handler of [...connectionHandlers]) {
    handler(true)
  }
})

socket.on('disconnect', (reason) => {
  if (reason !== CLIENT_DISCONNECT_REASON) {
    droppedSinceLastConnect = true
  }

  for (const handler of [...connectionHandlers]) {
    handler(false)
  }
})

socket.on('session:expired', () => {
  emitSessionExpired()
})

export function connectSocket(): void {
  socket.connect()
}

export function disconnectSocket(): void {
  socket.disconnect()
}

// Usado no login e no logout: desconecta e conecta de novo, com o token atual.
export function reconnectSocket(): void {
  socket.disconnect()
  socket.connect()
}

// Só envia se estiver conectado. Fora da conexão, o connect reenvia tudo o que está guardado.
export function subscribeNfts(ids: readonly string[]): void {
  const added: string[] = []
  for (const id of new Set(ids)) {
    if (!subscribedNftIds.has(id)) {
      subscribedNftIds.add(id)
      added.push(id)
    }
  }
  if (added.length > 0 && socket.connected) {
    socket.emit('nft:subscribe', { ids: added })
  }
}

export function unsubscribeNfts(ids: readonly string[]): void {
  const removed: string[] = []
  for (const id of new Set(ids)) {
    if (subscribedNftIds.delete(id)) {
      removed.push(id)
    }
  }
  if (removed.length > 0 && socket.connected) {
    socket.emit('nft:unsubscribe', { ids: removed })
  }
}

export function subscribeOrder(orderId: string): void {
  if (subscribedOrderIds.has(orderId)) {
    return
  }
  subscribedOrderIds.add(orderId)
  if (socket.connected) {
    socket.emit('order:subscribe', { orderId })
  }
}

// Envia nft:unsubscribe do que estava inscrito e esvazia os conjuntos.
// O protocolo não tem unsubscribe de pedido, então os pedidos só saem do conjunto.
export function clearSubscriptions(): void {
  const nftIdsToRemove = [...subscribedNftIds]
  subscribedNftIds.clear()
  subscribedOrderIds.clear()
  if (nftIdsToRemove.length > 0 && socket.connected) {
    socket.emit('nft:unsubscribe', { ids: nftIdsToRemove })
  }
}

export function onSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): () => void {
  // O socket.io-client não resolve o tipo do listener quando o nome do evento é genérico.
  // A assinatura pública já garante o par evento/payload, então o cast fica só aqui.
  const listener = handler as never
  socket.on(event, listener)
  return () => {
    socket.off(event, listener)
  }
}

// Dispara quando conecta de novo depois de uma queda. Quem chama invalida as queries afetadas.
export function onReconnect(handler: ReconnectHandler): () => void {
  reconnectHandlers.add(handler)
  return () => {
    reconnectHandlers.delete(handler)
  }
}

export function isSocketConnected(): boolean {
  return socket.connected
}

// Dispara a cada mudança de conexão (true ao conectar, false ao desconectar, qualquer motivo).
export function onSocketConnection(handler: ConnectionHandler): () => void {
  connectionHandlers.add(handler)
  return () => {
    connectionHandlers.delete(handler)
  }
}
