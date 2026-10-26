import type { CatalogQuery } from './catalogParams'
import type { NftRecord } from './db'
import { ethToUnits } from './money'

export type CatalogContext = {
  // Maior createdAt do catálogo; referência da aba "Novos". 0 quando não há NFTs.
  referenceMs: number
  // Ids dos 48 NFTs com maior sales7d + favorites7d.
  trendingIds: ReadonlySet<string>
  // Favoritos do usuário; null para visitante.
  favoriteIds: ReadonlySet<string> | null
}

export type SkippableFilter = 'collection' | 'network' | 'price'

const TRENDING_LIMIT = 48
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

// Minúsculas, sem acento e com espaços simples: a busca não diferencia caixa nem acento.
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Ordem por código Unicode, para o desempate ser igual em qualquer ambiente.
function compareIds(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function buildCatalogContext(
  all: NftRecord[],
  favoriteIds: ReadonlySet<string> | null,
): CatalogContext {
  let referenceMs = 0
  for (const nft of all) {
    const createdMs = Date.parse(nft.createdAt)
    if (createdMs > referenceMs) referenceMs = createdMs
  }

  const ranked = [...all].sort((a, b) => {
    const diff = b.stats.sales7d + b.stats.favorites7d - (a.stats.sales7d + a.stats.favorites7d)
    return diff !== 0 ? diff : compareIds(a.id, b.id)
  })
  const trendingIds = new Set(ranked.slice(0, TRENDING_LIMIT).map((nft) => nft.id))

  return { referenceMs, trendingIds, favoriteIds }
}

// Todas as palavras da busca devem aparecer em algum campo. "#0042" e "0042" acham o mesmo token.
function matchesSearch(nft: NftRecord, words: readonly string[]): boolean {
  const tokenId = normalizeText(nft.tokenId)
  const texts = [
    normalizeText(nft.name),
    tokenId,
    tokenId.replace(/#/g, ''),
    normalizeText(nft.collection.name),
    ...nft.attributes.map(normalizeText),
  ]

  return words.every((word) => {
    const bare = word.replace(/#/g, '')
    return texts.some((text) => text.includes(word) || (bare !== '' && text.includes(bare)))
  })
}

// Aplica os filtros ativos da busca; `skip` ignora um grupo (usado pelas contagens dos facets).
export function applyFilters(
  nfts: NftRecord[],
  query: CatalogQuery,
  context: CatalogContext,
  skip?: SkippableFilter,
): NftRecord[] {
  const words =
    query.q === null
      ? []
      : normalizeText(query.q)
          .split(' ')
          .filter((w) => w !== '')

  return nfts.filter((nft) => {
    if (words.length > 0 && !matchesSearch(nft, words)) return false

    if (query.tab === 'new' && Date.parse(nft.createdAt) < context.referenceMs - NEW_WINDOW_MS) {
      return false
    }
    if (query.tab === 'trending' && !context.trendingIds.has(nft.id)) return false

    if (
      skip !== 'collection' &&
      query.collection !== null &&
      nft.collection.id !== query.collection
    ) {
      return false
    }
    if (skip !== 'network' && query.network !== null && nft.network !== query.network) {
      return false
    }

    if (skip !== 'price' && (query.minUnits !== null || query.maxUnits !== null)) {
      const units = ethToUnits(nft.price)
      if (query.minUnits !== null && units < query.minUnits) return false
      if (query.maxUnits !== null && units > query.maxUnits) return false
    }

    if (query.favorites && !(context.favoriteIds?.has(nft.id) ?? false)) return false

    return true
  })
}
