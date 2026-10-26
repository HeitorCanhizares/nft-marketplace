import type { Edition, NftSummary } from '@/types/nft'
import type { NftRecord } from './db'
import { ethToUnits } from './money'

// Monta o NftSummary da API a partir do registro do banco, campo a campo (sem stats, createdAt nem editions).
export function toNftSummary(record: NftRecord, favoriteIds?: ReadonlySet<string>): NftSummary {
  const { editions } = record
  // Esgotado: há edições e todas com available === 0 (null = ilimitada, nunca esgota).
  const soldOut = editions.length > 0 && editions.every((edition) => edition.available === 0)

  const summary: NftSummary = {
    id: record.id,
    name: record.name,
    tokenId: record.tokenId,
    image: { src: record.image.src, alt: record.image.alt },
    price: record.price,
    collection: { id: record.collection.id, name: record.collection.name },
    network: record.network,
    soldOut,
  }

  if (record.previousPrice !== undefined) summary.previousPrice = record.previousPrice
  if (record.rarity !== undefined) summary.rarity = record.rarity

  const defaultEditionId = soldOut ? undefined : findDefaultEditionId(editions)
  if (defaultEditionId !== undefined) summary.defaultEditionId = defaultEditionId

  // Visitante: sem favoriteIds a chave é omitida.
  if (favoriteIds !== undefined) summary.isFavorite = favoriteIds.has(record.id)

  return summary
}

// Edição vendável (ilimitada ou com estoque) de menor preço; empate fica com a primeira da lista.
function findDefaultEditionId(editions: Edition[]): string | undefined {
  let best: Edition | undefined
  for (const edition of editions) {
    if (edition.available !== null && edition.available <= 0) continue
    if (best === undefined || ethToUnits(edition.price) < ethToUnits(best.price)) {
      best = edition
    }
  }
  return best?.id
}
