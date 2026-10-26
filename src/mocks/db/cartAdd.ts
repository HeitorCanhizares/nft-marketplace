import type { CartItem } from '@/types/cart'
import type { CartRecord } from './db'
import { toNftSummary } from './nftSummary'
import { multiplyEth } from './money'
import { cartsStore, nftsStore } from './stores'

export type AddToCartOwner = { cartId: string; ownerId: string }

export type AddToCartInput = { nftId: string; editionId: string; quantity: number }

export type AddToCartResult =
  | { ok: true; cart: CartRecord }
  | {
      ok: false
      code: 'NOT_FOUND' | 'SOLD_OUT' | 'QUANTITY_EXCEEDS_STOCK'
      message: string
      details?: Record<string, unknown>
    }

const LOW_STOCK_THRESHOLD = 3

// Soma a quantidade ao item já existente (mesmo NFT e edição), respeitando o estoque da edição.
export async function addToCart(
  owner: AddToCartOwner,
  input: AddToCartInput,
): Promise<AddToCartResult> {
  const nft = await nftsStore.get(input.nftId)
  const edition = nft?.editions.find((candidate) => candidate.id === input.editionId)
  if (nft === undefined || edition === undefined) {
    return { ok: false, code: 'NOT_FOUND', message: 'Não encontramos este NFT.' }
  }

  if (edition.available === 0) {
    return { ok: false, code: 'SOLD_OUT', message: 'Este NFT esgotou.' }
  }

  const stored = await cartsStore.get(owner.cartId)
  const cart: CartRecord = stored ?? {
    id: owner.cartId,
    ownerId: owner.ownerId,
    items: [],
    itemCount: 0,
    version: 0,
  }

  const index = cart.items.findIndex(
    (item) => item.nft.id === nft.id && item.edition.id === edition.id,
  )
  const existing = index === -1 ? undefined : cart.items[index]
  const inCart = existing?.quantity ?? 0
  const requested = inCart + input.quantity

  if (edition.available !== null && requested > edition.available) {
    return {
      ok: false,
      code: 'QUANTITY_EXCEEDS_STOCK',
      message: 'Você já tem o máximo disponível deste NFT no carrinho.',
      details: { available: edition.available, inCart },
    }
  }

  const item: CartItem = {
    id: existing?.id ?? `item-${crypto.randomUUID()}`,
    nft: toNftSummary(nft),
    edition: { id: edition.id, label: edition.label },
    quantity: requested,
    unitPrice: edition.price,
    lineTotal: multiplyEth(edition.price, requested),
    availability:
      edition.available !== null && edition.available <= LOW_STOCK_THRESHOLD
        ? 'low_stock'
        : 'available',
    available: edition.available,
  }

  const items = [...cart.items]
  if (index === -1) items.push(item)
  else items[index] = item

  const updated: CartRecord = {
    ...cart,
    items,
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
    version: cart.version + 1,
  }
  await cartsStore.put(updated)

  return { ok: true, cart: updated }
}
