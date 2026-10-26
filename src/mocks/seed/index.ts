import type { Post, Promo, Review } from '../../types/nft'
import type { FavoriteRecord, MockDbSchema, NftRecord, UserRecord, WalletRecord } from '../db/db'
import { seedCollections } from './collections'
import { SEED_POSTS, SEED_PROMOS, buildSeedReviews } from './content'
import { SEED_FAVORITE_IDS, SEED_NFT_CREATED_AT, SEED_NFT_STATS, buildSeedNfts } from './nfts'
import { seedUsers, seedWallets } from './users'

// Incremente ao mudar qualquer dado do seed: o banco do navegador é recriado na próxima execução.
export const SEED_VERSION = 3

// Dono dos favoritos do seed (usuário de teste, definido em users.ts).
const TEST_USER_ID = 'user-teste'

export type SeedData = {
  collections: MockDbSchema['collections']['value'][]
  users: UserRecord[]
  wallets: WalletRecord[]
  nfts: NftRecord[]
  reviews: Review[]
  favorites: FavoriteRecord[]
  // Posts e promos não vão para o banco: ficam em memória para o GET /home.
  posts: Post[]
  promos: Promo[]
}

export function buildSeedData(): SeedData {
  const nfts: NftRecord[] = buildSeedNfts().map((nft) => ({
    ...nft,
    createdAt: SEED_NFT_CREATED_AT[nft.id],
    stats: SEED_NFT_STATS[nft.id],
  }))

  return {
    collections: seedCollections.map(({ id, name }) => ({ id, name })),
    users: [...seedUsers],
    wallets: [...seedWallets],
    nfts,
    reviews: buildSeedReviews(nfts),
    favorites: SEED_FAVORITE_IDS.map((nftId) => ({ userId: TEST_USER_ID, nftId })),
    posts: [...SEED_POSTS],
    promos: [...SEED_PROMOS],
  }
}
