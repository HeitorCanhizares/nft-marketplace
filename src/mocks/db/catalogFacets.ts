import type { CatalogFacets, Network } from '@/types/nft'
import { seedCollections } from '../seed/collections'
import type { CatalogQuery } from './catalogParams'
import { applyFilters, type CatalogContext } from './catalogFilter'
import type { NftRecord } from './db'
import { ethToUnits, unitsToEth } from './money'

// Redes na ordem fixa do Figma.
const NETWORKS: readonly { id: Network; name: string }[] = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'solana', name: 'Solana' },
]

// Contagem por chave, para os NFTs que passam nos filtros (menos o grupo ignorado).
function countBy(nfts: NftRecord[], key: (nft: NftRecord) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const nft of nfts) {
    const id = key(nft)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

// Contagens e faixa de preço do GET /nfts. A faixa usa o catálogo inteiro, sem filtros.
export function buildFacets(
  all: NftRecord[],
  query: CatalogQuery,
  context: CatalogContext,
): CatalogFacets {
  const forCollections = countBy(
    applyFilters(all, query, context, 'collection'),
    (nft) => nft.collection.id,
  )
  const forNetworks = countBy(applyFilters(all, query, context, 'network'), (nft) => nft.network)

  const collections = seedCollections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    count: forCollections.get(collection.id) ?? 0,
  }))

  const networks = NETWORKS.map((network) => ({
    id: network.id,
    name: network.name,
    count: forNetworks.get(network.id) ?? 0,
  }))

  if (all.length === 0) {
    return { collections, networks, priceRange: { min: '0.00', max: '0.00' } }
  }

  let minUnits = Number.POSITIVE_INFINITY
  let maxUnits = Number.NEGATIVE_INFINITY
  for (const nft of all) {
    const units = ethToUnits(nft.price)
    if (units < minUnits) minUnits = units
    if (units > maxUnits) maxUnits = units
  }

  return {
    collections,
    networks,
    priceRange: { min: unitsToEth(minUnits), max: unitsToEth(maxUnits) },
  }
}
