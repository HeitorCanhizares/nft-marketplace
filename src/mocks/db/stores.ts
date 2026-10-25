import type { Quote } from '../../types/cart'
import type { Review } from '../../types/nft'
import {
  getDb,
  type AvatarRecord,
  type CartRecord,
  type FavoriteRecord,
  type IdempotencyRecord,
  type MetaRecord,
  type MockDbSchema,
  type NftRecord,
  type OrderRecord,
  type SessionRecord,
  type UserRecord,
  type WalletRecord,
} from './db'

export type CollectionRecord = MockDbSchema['collections']['value']

export const nftsStore = {
  get: async (id: string) => (await getDb()).get('nfts', id),
  getAll: async () => (await getDb()).getAll('nfts'),
  put: async (nft: NftRecord) => {
    await (await getDb()).put('nfts', nft)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('nfts', id)
  },
}

export const collectionsStore = {
  get: async (id: string) => (await getDb()).get('collections', id),
  getAll: async () => (await getDb()).getAll('collections'),
  put: async (collection: CollectionRecord) => {
    await (await getDb()).put('collections', collection)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('collections', id)
  },
}

export const usersStore = {
  get: async (id: string) => (await getDb()).get('users', id),
  getByEmail: async (email: string) => (await getDb()).getFromIndex('users', 'email', email),
  getByUsername: async (username: string) =>
    (await getDb()).getFromIndex('users', 'username', username),
  getAll: async () => (await getDb()).getAll('users'),
  put: async (user: UserRecord) => {
    await (await getDb()).put('users', user)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('users', id)
  },
}

export const sessionsStore = {
  get: async (token: string) => (await getDb()).get('sessions', token),
  put: async (session: SessionRecord) => {
    await (await getDb()).put('sessions', session)
  },
  delete: async (token: string) => {
    await (await getDb()).delete('sessions', token)
  },
}

export const cartsStore = {
  get: async (id: string) => (await getDb()).get('carts', id),
  put: async (cart: CartRecord) => {
    await (await getDb()).put('carts', cart)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('carts', id)
  },
}

export const quotesStore = {
  get: async (id: string) => (await getDb()).get('quotes', id),
  put: async (quote: Quote) => {
    await (await getDb()).put('quotes', quote)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('quotes', id)
  },
}

export const ordersStore = {
  get: async (id: string) => (await getDb()).get('orders', id),
  // Não há índice por userId na store; a lista é filtrada na leitura.
  listByUserId: async (userId: string) =>
    (await (await getDb()).getAll('orders')).filter((order) => order.userId === userId),
  // Pedido já salvo mantém o snapshot: só status, txHash, explorerUrl e declineReason são regravados.
  put: async (order: OrderRecord) => {
    const db = await getDb()
    const tx = db.transaction('orders', 'readwrite')
    const existing = await tx.store.get(order.id)
    const record: OrderRecord = existing
      ? {
          ...existing,
          status: order.status,
          txHash: order.txHash,
          explorerUrl: order.explorerUrl,
          declineReason: order.declineReason,
        }
      : order
    await tx.store.put(record)
    await tx.done
  },
}

export const idempotencyStore = {
  get: async (key: string) => (await getDb()).get('idempotency', key),
  put: async (record: IdempotencyRecord) => {
    await (await getDb()).put('idempotency', record)
  },
  delete: async (key: string) => {
    await (await getDb()).delete('idempotency', key)
  },
}

export const favoritesStore = {
  listByUserId: async (userId: string) =>
    // Chave composta [userId, nftId]: o intervalo pega todos os favoritos do usuário.
    (await getDb()).getAll('favorites', IDBKeyRange.bound([userId], [userId, []])),
  get: async (userId: string, nftId: string) => (await getDb()).get('favorites', [userId, nftId]),
  add: async (favorite: FavoriteRecord) => {
    await (await getDb()).put('favorites', favorite)
  },
  remove: async (userId: string, nftId: string) => {
    await (await getDb()).delete('favorites', [userId, nftId])
  },
}

export const walletsStore = {
  get: async (id: string) => (await getDb()).get('wallets', id),
  getByUserId: async (userId: string) =>
    (await getDb()).getAllFromIndex('wallets', 'userId', userId),
  put: async (wallet: WalletRecord) => {
    await (await getDb()).put('wallets', wallet)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('wallets', id)
  },
}

export const avatarsStore = {
  get: async (userId: string) => (await getDb()).get('avatars', userId),
  put: async (avatar: AvatarRecord) => {
    await (await getDb()).put('avatars', avatar)
  },
  delete: async (userId: string) => {
    await (await getDb()).delete('avatars', userId)
  },
}

export const reviewsStore = {
  get: async (id: string) => (await getDb()).get('reviews', id),
  getByNftId: async (nftId: string) => (await getDb()).getAllFromIndex('reviews', 'nftId', nftId),
  put: async (review: Review) => {
    await (await getDb()).put('reviews', review)
  },
  delete: async (id: string) => {
    await (await getDb()).delete('reviews', id)
  },
}

export const metaStore = {
  get: async (key: string) => (await getDb()).get('meta', key),
  put: async (meta: MetaRecord) => {
    await (await getDb()).put('meta', meta)
  },
  delete: async (key: string) => {
    await (await getDb()).delete('meta', key)
  },
}
