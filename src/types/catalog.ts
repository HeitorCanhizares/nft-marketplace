import type { CatalogFacets, Network, NftSummary, Paginated } from '@/types/nft'

export type CatalogTab = 'todos' | 'novos' | 'em-alta'

export type CatalogSort =
  'recentes' | 'menor-preco' | 'maior-preco' | 'mais-avaliados' | 'mais-favoritados'

// Parâmetros de busca da rota `/` (estado na URL, em PT-BR).
export type HomeSearch = {
  q?: string
  aba?: CatalogTab
  colecao?: string
  rede?: Network
  precoMin?: number
  precoMax?: number
  ordem?: CatalogSort
  pagina?: number
  favoritos?: 1
}

export type CatalogResponse = Paginated<NftSummary> & { facets: CatalogFacets }

// Parâmetros enviados à API (valores em inglês). Padrões (aba `all`, ordem `recent`) não são enviados.
export type CatalogApiParams = {
  q?: string
  tab?: 'new' | 'trending'
  collection?: string
  network?: Network
  minPrice?: string
  maxPrice?: string
  sort?: 'price_asc' | 'price_desc' | 'top_rated' | 'most_favorited'
  page: number
  pageSize: number
  favorites?: 1
}
