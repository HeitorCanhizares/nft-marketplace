import type { Quote } from '../../types/cart'
import type { Order, OrderItemSnapshot } from '../../types/order'
import type { OrderRecord } from './db'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// JSON com chaves ordenadas em todos os níveis: o mesmo corpo sempre gera a mesma string.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item: unknown) => stableStringify(item)).join(',')}]`
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

// SHA-256 em hexadecimal do corpo (chaves ordenadas).
export async function hashBody(body: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(body))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Uma entrada por linha não esgotada, copiada da cotação.
export function snapshotItems(quote: Quote): OrderItemSnapshot[] {
  return quote.items
    .filter((item) => item.availability !== 'sold_out')
    .map((item) => ({
      nftId: item.nft.id,
      name: item.nft.name,
      tokenId: item.nft.tokenId,
      image: { src: item.nft.image.src, alt: item.nft.image.alt },
      editionId: item.edition.id,
      editionLabel: item.edition.label,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }))
}

// Nunca devolve userId.
export function toOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    status: record.status,
    createdAt: record.createdAt,
    quoteId: record.quoteId,
    ...(record.txHash === undefined ? {} : { txHash: record.txHash }),
    ...(record.declineReason === undefined ? {} : { declineReason: record.declineReason }),
    network: record.network,
    wallet: { ...record.wallet },
    collector: { ...record.collector },
    items: record.items,
    subtotal: record.subtotal,
    discount: record.discount,
    ...(record.coupon === undefined ? {} : { coupon: { code: record.coupon.code } }),
    networkFee: record.networkFee,
    total: record.total,
    ...(record.explorerUrl === undefined ? {} : { explorerUrl: record.explorerUrl }),
  }
}
