import type { Edition } from '@/types/nft'

// Limite de unidades por compra quando a edição é ilimitada (ABERTA).
export const MAX_PER_PURCHASE = 99

export type QuantityLimit = { max: number; kind: 'stock' | 'cap' }

// Quanto ainda cabe comprar: o estoque (ou o teto por compra) menos o que já está no carrinho.
export function quantityLimit(edition: Edition, inCart: number): QuantityLimit {
  if (edition.available === null) {
    return { max: Math.max(0, MAX_PER_PURCHASE - inCart), kind: 'cap' }
  }
  return { max: Math.max(0, edition.available - inCart), kind: 'stock' }
}
