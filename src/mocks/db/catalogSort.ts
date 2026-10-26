import type { CatalogQuery } from './catalogParams'
import type { NftRecord } from './db'
import { ethToUnits } from './money'

// Desempate por id em ordem Unicode, para a ordem ser sempre a mesma.
function compareIds(a: NftRecord, b: NftRecord): number {
  if (a.id < b.id) return -1
  if (a.id > b.id) return 1
  return 0
}

// Devolve uma cópia ordenada; a lista recebida não é alterada.
export function sortNfts(
  nfts: NftRecord[],
  sort: CatalogQuery['sort'],
  favoriteCounts: ReadonlyMap<string, number>,
): NftRecord[] {
  const compare = (a: NftRecord, b: NftRecord): number => {
    switch (sort) {
      case 'recent':
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      case 'price_asc':
        return ethToUnits(a.price) - ethToUnits(b.price)
      case 'price_desc':
        return ethToUnits(b.price) - ethToUnits(a.price)
      case 'top_rated':
        return b.rating.average - a.rating.average || b.rating.count - a.rating.count
      case 'most_favorited':
        return (favoriteCounts.get(b.id) ?? 0) - (favoriteCounts.get(a.id) ?? 0)
    }
  }

  return [...nfts].sort((a, b) => compare(a, b) || compareIds(a, b))
}
