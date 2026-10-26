import { DESKTOP_PAGE_SIZE } from '@/lib/catalogOptions'
import { z } from 'zod'
import type { CatalogApiParams, CatalogResponse, HomeSearch } from '@/types/catalog'
import type { HomeResponse, NftDetail, NftSummary, Paginated, Review } from '@/types/nft'
import {
  catalogResponseSchema,
  homeResponseSchema,
  nftDetailSchema,
  nftSummarySchema,
  reviewPageSchema,
} from '@/schemas/nft'
import { get } from '@/services/http/validate'

const TAB_TO_API = { novos: 'new', 'em-alta': 'trending' } as const

const SORT_TO_API = {
  'menor-preco': 'price_asc',
  'maior-preco': 'price_desc',
  'mais-avaliados': 'top_rated',
  'mais-favoritados': 'most_favorited',
} as const

// Converte a busca da Início (PT-BR) nos parâmetros de GET /nfts. Padrões não são enviados.
export function toCatalogParams(search: HomeSearch, isDesktop: boolean): CatalogApiParams {
  const pagina = search.pagina ?? 1
  const params: CatalogApiParams = isDesktop
    ? { page: pagina, pageSize: DESKTOP_PAGE_SIZE }
    : { page: 1, pageSize: Math.min(DESKTOP_PAGE_SIZE * pagina, 300) }

  if (search.q !== undefined) params.q = search.q
  if (search.colecao !== undefined) params.collection = search.colecao
  if (search.rede !== undefined) params.network = search.rede
  if (search.favoritos === 1) params.favorites = 1
  if (search.aba !== undefined && search.aba !== 'todos') params.tab = TAB_TO_API[search.aba]
  if (search.ordem !== undefined && search.ordem !== 'recentes') {
    params.sort = SORT_TO_API[search.ordem]
  }
  if (search.precoMin !== undefined) params.minPrice = search.precoMin.toFixed(2)
  if (search.precoMax !== undefined) params.maxPrice = search.precoMax.toFixed(2)

  return params
}

export function getCatalog(
  params: CatalogApiParams,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  return get('/nfts', catalogResponseSchema, { params, signal })
}

export function getHome(signal?: AbortSignal): Promise<HomeResponse> {
  return get('/home', homeResponseSchema, { signal })
}

export function getNft(id: string, signal?: AbortSignal): Promise<NftDetail> {
  return get(`/nfts/${encodeURIComponent(id)}`, nftDetailSchema, { signal })
}

export function getRelatedNfts(id: string, signal?: AbortSignal): Promise<NftSummary[]> {
  return get(`/nfts/${encodeURIComponent(id)}/related`, z.array(nftSummarySchema), { signal })
}

export function getRecommendedNfts(signal?: AbortSignal): Promise<NftSummary[]> {
  return get('/nfts/recommendations', z.array(nftSummarySchema), { signal })
}

export function getReviews(
  id: string,
  page: number,
  signal?: AbortSignal,
): Promise<Paginated<Review>> {
  return get(`/nfts/${encodeURIComponent(id)}/reviews`, reviewPageSchema, {
    params: { page },
    signal,
  })
}
