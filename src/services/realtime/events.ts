import type { Edition } from '@/types/nft'
import type { OrderStatus } from '@/types/order'

// Payloads de docs/api-mock/realtime.md.

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

export type SessionExpiredPayload = Record<string, never>

export type NftSubscribePayload = {
  ids: string[]
}

export type NftUnsubscribePayload = {
  ids: string[]
}

export type OrderSubscribePayload = {
  orderId: string
}

// Eventos enviados pelo servidor (cliente ouve).
export type ServerToClientEvents = {
  'nft:price_changed': (payload: NftPriceChangedPayload) => void
  'nft:stock_changed': (payload: NftStockChangedPayload) => void
  'order:updated': (payload: OrderUpdatedPayload) => void
  'session:expired': (payload: SessionExpiredPayload) => void
}

// Eventos de inscrição enviados pelo cliente (cliente emite).
export type ClientToServerEvents = {
  'nft:subscribe': (payload: NftSubscribePayload) => void
  'nft:unsubscribe': (payload: NftUnsubscribePayload) => void
  'order:subscribe': (payload: OrderSubscribePayload) => void
}
