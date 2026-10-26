// Convenção de ids do carrinho (o Opus replica em docs/api-mock/contratos.md):
// - carrinho do usuário: id = 'cart-' + userId, ownerId = userId;
// - carrinho de visitante: id = valor do header X-Cart-Id, ownerId = o mesmo valor.
import type { CartAdjustment, CartItem } from '../../types/cart'
import type { CartRecord } from './db'
import { multiplyEth } from './money'
import { cartsStore, nftsStore } from './stores'

export function userCartId(userId: string): string {
  return `cart-${userId}`
}

export type CartMergeResult = {
  cart: CartRecord | null
  adjustments: CartAdjustment[]
}

function itemKey(nftId: string, editionId: string): string {
  return `${nftId}:${editionId}`
}

// Mescla o carrinho do visitante no do usuário, respeitando o estoque atual.
export async function mergeGuestCart(
  userId: string,
  guestCartId: string | null,
): Promise<CartMergeResult> {
  const userCart = await cartsStore.get(userCartId(userId))
  const guest = guestCartId === null ? undefined : await cartsStore.get(guestCartId)

  if (guest === undefined || guest.items.length === 0) {
    return { cart: userCart ?? null, adjustments: [] }
  }

  const base: CartRecord = userCart ?? {
    id: userCartId(userId),
    ownerId: userId,
    items: [],
    itemCount: 0,
    version: 0,
  }
  const items: CartItem[] = [...base.items]
  const adjustments: CartAdjustment[] = []

  for (const guestItem of guest.items) {
    const key = itemKey(guestItem.nft.id, guestItem.edition.id)
    const index = items.findIndex((item) => itemKey(item.nft.id, item.edition.id) === key)
    const existing = index === -1 ? undefined : items[index]

    const requested = (existing?.quantity ?? 0) + guestItem.quantity
    const nft = await nftsStore.get(guestItem.nft.id)
    const edition = nft?.editions.find((candidate) => candidate.id === guestItem.edition.id)

    let applied = 0
    if (nft !== undefined && edition !== undefined) {
      applied = edition.available === null ? requested : Math.min(requested, edition.available)
    }

    if (applied < requested) {
      adjustments.push({
        nftId: guestItem.nft.id,
        nftName: nft?.name ?? guestItem.nft.name,
        editionId: guestItem.edition.id,
        editionLabel: edition?.label ?? guestItem.edition.label,
        requested,
        applied,
        reason: 'stock',
      })
    }

    if (applied === 0 || nft === undefined || edition === undefined) {
      if (index !== -1) items.splice(index, 1)
      continue
    }

    const merged: CartItem = {
      id: existing?.id ?? guestItem.id,
      nft: existing?.nft ?? guestItem.nft,
      edition: { id: edition.id, label: edition.label },
      quantity: applied,
      unitPrice: edition.price,
      lineTotal: multiplyEth(edition.price, applied),
      availability: 'available',
      available: edition.available,
    }

    if (index === -1) {
      items.push(merged)
    } else {
      items[index] = merged
    }
  }

  const coupon = base.coupon ?? guest.coupon
  const cart: CartRecord = {
    id: base.id,
    ownerId: userId,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    version: base.version + 1,
    ...(coupon === undefined ? {} : { coupon }),
  }

  await cartsStore.put(cart)
  await cartsStore.delete(guest.id)

  return { cart, adjustments }
}
