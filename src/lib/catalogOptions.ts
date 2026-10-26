import type { CatalogSort, CatalogTab, HomeSearch } from '@/types/catalog'
import type { Promo } from '@/types/nft'

export const CATALOG_TABS: { value: CatalogTab; label: string }[] = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'em-alta', label: 'Em alta' },
]

export const CATALOG_SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'recentes', label: 'Listados recentemente' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'mais-avaliados', label: 'Mais bem avaliados' },
  { value: 'mais-favoritados', label: 'Mais favoritados' },
]

export const DEFAULT_TAB: CatalogTab = 'todos'
export const DEFAULT_SORT: CatalogSort = 'recentes'
export const DESKTOP_PAGE_SIZE = 9

const TAB_FROM_API: Record<'new' | 'trending', CatalogTab> = {
  new: 'novos',
  trending: 'em-alta',
}

const SORT_FROM_API: Record<string, CatalogSort> = {
  recent: 'recentes',
  price_asc: 'menor-preco',
  price_desc: 'maior-preco',
  top_rated: 'mais-avaliados',
  most_favorited: 'mais-favoritados',
}

// Converte o `query` de um Promo (valores da API) para a busca da Início (valores em PT-BR).
export function promoToSearch(query: Promo['query']): HomeSearch {
  const aba = query.tab === 'new' || query.tab === 'trending' ? TAB_FROM_API[query.tab] : undefined
  const ordem = query.sort !== undefined ? SORT_FROM_API[query.sort] : undefined

  return {
    q: undefined,
    aba,
    colecao: query.collection,
    rede: query.network,
    precoMin: undefined,
    precoMax: undefined,
    ordem,
    pagina: undefined,
    favoritos: undefined,
  }
}
