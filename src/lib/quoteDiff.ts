import type { Quote } from '@/types/cart'
import type { QuoteChange } from '@/types/order'

export type QuoteChangeEntry =
  | { kind: 'PRICE_CHANGED'; itemId: string; name: string; from: string; to: string }
  | { kind: 'SOLD_OUT'; itemId: string; name: string }
  | { kind: 'COUPON_EXPIRED'; code: string }
  | { kind: 'FEE_CHANGED'; from: string; to: string }

// Compara a cotação exibida (before) com a nova (after). Linhas são casadas por item.id;
// linhas que existem só em um dos lados são ignoradas (o servidor trata como CART_CHANGED).
export function diffQuotes(before: Quote, after: Quote): QuoteChangeEntry[] {
  const afterById = new Map(after.items.map((item) => [item.id, item]))
  const pairs = before.items.flatMap((prev) => {
    const next = afterById.get(prev.id)
    return next ? [{ prev, next }] : []
  })

  const entries: QuoteChangeEntry[] = []

  for (const { prev, next } of pairs) {
    if (next.availability !== 'sold_out' && prev.unitPrice !== next.unitPrice) {
      entries.push({
        kind: 'PRICE_CHANGED',
        itemId: next.id,
        name: next.nft.name,
        from: prev.unitPrice,
        to: next.unitPrice,
      })
    }
  }

  for (const { prev, next } of pairs) {
    if (next.availability === 'sold_out' && prev.availability !== 'sold_out') {
      entries.push({ kind: 'SOLD_OUT', itemId: next.id, name: next.nft.name })
    }
  }

  const beforeCoupon = before.coupon
  if (beforeCoupon?.status === 'applied' && after.coupon?.status !== 'applied') {
    entries.push({ kind: 'COUPON_EXPIRED', code: beforeCoupon.code })
  }

  if (before.networkFee !== after.networkFee) {
    entries.push({ kind: 'FEE_CHANGED', from: before.networkFee, to: after.networkFee })
  }

  return entries
}

// Códigos sem repetição, na ordem em que aparecem nas entradas.
export function toChangeCodes(entries: readonly QuoteChangeEntry[]): QuoteChange[] {
  const codes: QuoteChange[] = []
  for (const entry of entries) {
    if (!codes.includes(entry.kind)) codes.push(entry.kind)
  }
  return codes
}
