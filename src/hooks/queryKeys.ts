export type QueryParams = Record<string, unknown>

export const nfts = {
  all: ['nfts'] as const,
  list: (params: QueryParams) => ['nfts', 'list', params] as const,
  detail: (id: string) => ['nfts', 'detail', id] as const,
  related: (id: string) => ['nfts', 'related', id] as const,
  reviews: (id: string, page: number) => ['nfts', 'reviews', id, page] as const,
}

export const home = ['home'] as const

export const favorites = ['favorites'] as const

export const cart = ['cart'] as const

export const quote = (input: QueryParams) => ['quote', input] as const

export const orders = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  pending: ['orders', 'pending'] as const,
}

export const profile = ['profile'] as const

export const wallets = ['wallets'] as const

export const session = ['session'] as const

export const PRIVATE_QUERY_ROOTS = [
  'favorites',
  'cart',
  'quote',
  'orders',
  'profile',
  'wallets',
  'session',
] as const
