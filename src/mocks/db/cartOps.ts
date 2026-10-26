import { cartSchema } from '@/schemas/cart'
import { MAX_PER_PURCHASE } from '@/lib/maxQuantity'
import type { Cart, CartItem } from '@/types/cart'
import type { ApiErrorCode } from '@/types/api'
import type { AddToCartOwner } from './cartAdd'
import type { CartRecord } from './db'
import { multiplyEth } from './money'
import { cartsStore, nftsStore } from './stores'
import { findCoupon } from '../seed/coupons'

const LOW_STOCK_THRESHOLD = 3

export type CouponResult =
  | { ok: true; cart: Cart }
  | {
      ok: false
      code: Extract<ApiErrorCode, 'COUPON_INVALID' | 'COUPON_EXPIRED'>
      message: string
    }

export type CartOpResult =
  | { ok: true; cart: Cart }
  | {
      ok: false
      code: Extract<ApiErrorCode, 'NOT_FOUND' | 'SOLD_OUT' | 'QUANTITY_EXCEEDS_STOCK'>
      message: string
      details?: Record<string, unknown>
    }

export function availabilityOf(
  available: number | null,
  quantity: number,
): CartItem['availability'] {
  if (available === null) return 'available'
  if (available === 0) return 'sold_out'
  if (available < quantity) return 'insufficient'
  if (available <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'available'
}

// Resposta do carrinho com preço e estoque atuais. Não grava nada.
// Linha cujo NFT sumiu é omitida; edição que sumiu mantém os valores gravados.
export async function toCartResponse(record: CartRecord): Promise<Cart> {
  const items: CartItem[] = []
  for (const line of record.items) {
    const nft = await nftsStore.get(line.nft.id)
    if (nft === undefined) continue

    const edition = nft.editions.find((candidate) => candidate.id === line.edition.id)
    if (edition === undefined) {
      items.push({
        ...line,
        availability: availabilityOf(line.available, line.quantity),
      })
      continue
    }

    items.push({
      ...line,
      unitPrice: edition.price,
      lineTotal: multiplyEth(edition.price, line.quantity),
      available: edition.available,
      availability: availabilityOf(edition.available, line.quantity),
    })
  }

  return cartSchema.parse({
    id: record.id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    version: record.version,
    ...(record.coupon === undefined ? {} : { coupon: record.coupon }),
  })
}

// Altera a quantidade da linha e regrava o preço atual (o usuário agiu sobre ela).
export async function updateItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number,
): Promise<CartOpResult> {
  const record = await cartsStore.get(cartId)
  const index = record?.items.findIndex((item) => item.id === itemId) ?? -1
  if (record === undefined || index === -1) {
    return { ok: false, code: 'NOT_FOUND', message: 'Não encontramos este item no carrinho.' }
  }

  const line = record.items[index]
  const nft = await nftsStore.get(line.nft.id)
  const edition = nft?.editions.find((candidate) => candidate.id === line.edition.id)
  if (nft === undefined || edition === undefined) {
    return { ok: false, code: 'NOT_FOUND', message: 'Não encontramos este NFT.' }
  }

  if (edition.available === 0) {
    return { ok: false, code: 'SOLD_OUT', message: 'Este NFT esgotou.' }
  }

  if (edition.available !== null && quantity > edition.available) {
    return {
      ok: false,
      code: 'QUANTITY_EXCEEDS_STOCK',
      message: 'A quantidade excede o estoque disponível.',
      details: { available: edition.available, inCart: line.quantity },
    }
  }

  if (edition.available === null && quantity > MAX_PER_PURCHASE) {
    return {
      ok: false,
      code: 'QUANTITY_EXCEEDS_STOCK',
      message: 'A quantidade excede o limite por compra.',
      details: { available: MAX_PER_PURCHASE, inCart: line.quantity },
    }
  }

  const updatedLine: CartItem = {
    ...line,
    quantity,
    unitPrice: edition.price,
    lineTotal: multiplyEth(edition.price, quantity),
    available: edition.available,
    availability: availabilityOf(edition.available, quantity),
  }

  const items = [...record.items]
  items[index] = updatedLine
  const updated: CartRecord = {
    ...record,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    version: record.version + 1,
  }
  await cartsStore.put(updated)

  return { ok: true, cart: await toCartResponse(updated) }
}

// Tira a linha do carrinho. Carrinho vazio continua gravado.
export async function removeItem(cartId: string, itemId: string): Promise<CartOpResult> {
  const record = await cartsStore.get(cartId)
  if (record === undefined || !record.items.some((item) => item.id === itemId)) {
    return { ok: false, code: 'NOT_FOUND', message: 'Não encontramos este item no carrinho.' }
  }

  const items = record.items.filter((item) => item.id !== itemId)
  const updated: CartRecord = {
    ...record,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    version: record.version + 1,
  }
  await cartsStore.put(updated)

  return { ok: true, cart: await toCartResponse(updated) }
}

// Guarda o cupom no carrinho (código normalizado). Em erro, nada é gravado.
export async function applyCoupon(owner: AddToCartOwner, code: string): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase()
  const terms = findCoupon(normalized)
  if (terms === undefined) {
    return { ok: false, code: 'COUPON_INVALID', message: 'Código promocional inválido.' }
  }
  if (terms.expired) {
    return { ok: false, code: 'COUPON_EXPIRED', message: 'Este código promocional expirou.' }
  }

  const stored = await cartsStore.get(owner.cartId)
  const record: CartRecord = stored ?? {
    id: owner.cartId,
    ownerId: owner.ownerId,
    items: [],
    itemCount: 0,
    version: 0,
  }
  const updated: CartRecord = {
    ...record,
    coupon: { code: normalized },
    version: record.version + 1,
  }
  await cartsStore.put(updated)

  return { ok: true, cart: await toCartResponse(updated) }
}

// Remove o cupom. Sem cupom (ou sem carrinho) não grava nada e devolve o carrinho como está.
export async function clearCoupon(cartId: string): Promise<Cart> {
  const record = await cartsStore.get(cartId)
  if (record === undefined) {
    return cartSchema.parse({ id: cartId, items: [], itemCount: 0, version: 0 })
  }
  if (record.coupon === undefined) return toCartResponse(record)

  const updated: CartRecord = {
    id: record.id,
    ownerId: record.ownerId,
    items: record.items,
    itemCount: record.itemCount,
    version: record.version + 1,
  }
  await cartsStore.put(updated)

  return toCartResponse(updated)
}
