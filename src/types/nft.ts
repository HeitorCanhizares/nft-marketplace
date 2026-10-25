export type Network = 'ethereum' | 'polygon' | 'solana'
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type NftSummary = {
  id: string
  name: string
  tokenId: string
  image: { src: string; alt: string }
  price: string
  previousPrice?: string
  rarity?: 'rare'
  collection: { id: string; name: string }
  network: Network
  isFavorite?: boolean
}

export type Edition = {
  id: string
  label: string
  supply: number | null
  available: number | null
  price: string
}

export type NftDetail = NftSummary & {
  description: string
  images: { src: string; alt: string }[]
  editions: Edition[]
  attributes: string[]
  rating: { average: number; count: number }
  details: { body: string; network: string; contract: string; royalties: string }
}

export type CatalogFacets = {
  collections: { id: string; name: string; count: number }[]
  networks: { id: string; name: string; count: number }[]
  priceRange: { min: string; max: string }
}

export type Review = {
  id: string
  nftId: string
  author: string
  rating: 1 | 2 | 3 | 4 | 5
  body: string
  createdAt: string
}

export type Promo = {
  id: string
  title: string
  text: string
  ctaLabel: string
  query: { collection?: string; network?: Network; sort?: string }
}

export type Post = {
  id: string
  date: string
  readingMinutes: number
  title: string
  summary: string
}

export type HomeResponse = {
  hero: NftSummary[]
  featured: NftSummary
  promos: Promo[]
  posts: Post[]
}
