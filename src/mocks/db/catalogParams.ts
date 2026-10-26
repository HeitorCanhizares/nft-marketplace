import { ethAmountSchema, networkSchema } from '@/schemas/common'
import type { Network } from '@/types/nft'
import { ethToUnits } from './money'

export type CatalogQuery = {
  q: string | null
  tab: 'all' | 'new' | 'trending'
  collection: string | null
  network: Network | null
  minUnits: number | null
  maxUnits: number | null
  sort: 'recent' | 'price_asc' | 'price_desc' | 'top_rated' | 'most_favorited'
  page: number
  pageSize: number
  favorites: boolean
}

export type CatalogQueryResult =
  { ok: true; query: CatalogQuery } | { ok: false; fields: Record<string, string> }

const TABS = ['all', 'new', 'trending'] as const
const SORTS = ['recent', 'price_asc', 'price_desc', 'top_rated', 'most_favorited'] as const
const MAX_Q_LENGTH = 100
const MAX_COLLECTION_LENGTH = 60
const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 300

type Fields = Record<string, string>

// Lê um valor de uma lista fechada; ausente usa o padrão, fora da lista registra erro.
function readEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
  field: string,
  message: string,
  fields: Fields,
): T {
  if (value === null) return fallback
  const match = allowed.find((item) => item === value)
  if (match === undefined) {
    fields[field] = message
    return fallback
  }
  return match
}

// Lê um inteiro decimal dentro do intervalo; ausente usa o padrão.
function readInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  field: string,
  message: string,
  fields: Fields,
): number {
  if (value === null) return fallback
  const number = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min || number > max) {
    fields[field] = message
    return fallback
  }
  return number
}

// Lê um preço em ETH como unidades inteiras; ausente vira null.
function readPriceUnits(value: string | null, field: string, fields: Fields): number | null {
  if (value === null) return null
  const parsed = ethAmountSchema.safeParse(value)
  if (!parsed.success) {
    fields[field] = 'Informe o preço em ETH, como 1.19.'
    return null
  }
  try {
    return ethToUnits(value)
  } catch {
    fields[field] = 'Informe o preço em ETH, como 1.19.'
    return null
  }
}

// Transforma a query string de GET /nfts num objeto tipado, ou devolve os erros por campo (422).
export function parseCatalogQuery(params: URLSearchParams): CatalogQueryResult {
  const fields: Fields = {}

  const qText = params.get('q')?.trim() ?? ''
  if (qText.length > MAX_Q_LENGTH) {
    fields.q = 'A busca deve ter no máximo 100 caracteres.'
  }

  const tab = readEnum(params.get('tab'), TABS, 'all', 'tab', 'Aba inválida.', fields)

  const sort = readEnum(params.get('sort'), SORTS, 'recent', 'sort', 'Ordenação inválida.', fields)

  const collectionText = params.get('collection')?.trim() ?? ''
  if (collectionText.length > MAX_COLLECTION_LENGTH) {
    fields.collection = 'A coleção deve ter no máximo 60 caracteres.'
  }

  const networkText = params.get('network')
  let network: Network | null = null
  if (networkText !== null) {
    const parsed = networkSchema.safeParse(networkText)
    if (parsed.success) network = parsed.data
    else fields.network = 'Rede inválida.'
  }

  const minUnits = readPriceUnits(params.get('minPrice'), 'minPrice', fields)
  const maxUnits = readPriceUnits(params.get('maxPrice'), 'maxPrice', fields)
  if (minUnits !== null && maxUnits !== null && minUnits > maxUnits) {
    fields.maxPrice = 'O preço máximo deve ser maior ou igual ao mínimo.'
  }

  const page = readInteger(
    params.get('page'),
    1,
    1,
    Number.MAX_SAFE_INTEGER,
    'page',
    'A página deve ser um número inteiro a partir de 1.',
    fields,
  )

  const pageSize = readInteger(
    params.get('pageSize'),
    DEFAULT_PAGE_SIZE,
    1,
    MAX_PAGE_SIZE,
    'pageSize',
    'O tamanho da página deve ficar entre 1 e 300.',
    fields,
  )

  const favoritesText = params.get('favorites')
  let favorites = false
  if (favoritesText !== null) {
    if (favoritesText === '1') favorites = true
    else fields.favorites = 'O filtro de favoritos aceita somente o valor 1.'
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields }
  }

  return {
    ok: true,
    query: {
      q: qText === '' ? null : qText,
      tab,
      collection: collectionText === '' ? null : collectionText,
      network,
      minUnits,
      maxUnits,
      sort,
      page,
      pageSize,
      favorites,
    },
  }
}
