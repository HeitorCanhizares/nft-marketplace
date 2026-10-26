import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Cart, Quote } from '../../types/cart'
import type { NftDetail, Review } from '../../types/nft'
import type { Order } from '../../types/order'
import type { User, Wallet } from '../../types/user'

const DB_NAME = 'kurio-mock-db'
const DB_VERSION = 1

// Números de vendas e favoritos para "Em alta" e "Mais favoritados". Fora do contrato; os handlers removem ao responder.
export type NftStats = {
  sales7d: number
  favorites7d: number
  favoritesTotal: number
}

// createdAt e stats ficam fora de NftDetail (contrato); os handlers removem os campos ao responder.
export type NftRecord = NftDetail & {
  createdAt: string
  stats: NftStats
}

export type UserRecord = User & {
  passwordHash: string
  passwordSalt: string
}

export type SessionRecord = {
  token: string
  expiresAt: string
  userId: string
}

export type CartRecord = Cart & {
  ownerId: string
}

export type OrderRecord = Order & {
  userId: string
}

export type IdempotencyRecord = {
  key: string
  bodyHash: string
  orderId: string
  createdAt: string
}

export type FavoriteRecord = {
  userId: string
  nftId: string
}

export type WalletRecord = Wallet & {
  userId: string
}

export type AvatarRecord = {
  userId: string
  blob: Blob
}

export type MetaRecord = {
  key: string
  value: string
}

export interface MockDbSchema extends DBSchema {
  nfts: {
    key: string
    value: NftRecord
  }
  collections: {
    key: string
    value: { id: string; name: string }
  }
  users: {
    key: string
    value: UserRecord
    indexes: { email: string; username: string }
  }
  sessions: {
    key: string
    value: SessionRecord
  }
  carts: {
    key: string
    value: CartRecord
  }
  quotes: {
    key: string
    value: Quote
  }
  orders: {
    key: string
    value: OrderRecord
  }
  idempotency: {
    key: string
    value: IdempotencyRecord
  }
  favorites: {
    key: [string, string]
    value: FavoriteRecord
  }
  wallets: {
    key: string
    value: WalletRecord
    indexes: { userId: string }
  }
  avatars: {
    key: string
    value: AvatarRecord
  }
  reviews: {
    key: string
    value: Review
    indexes: { nftId: string }
  }
  meta: {
    key: string
    value: MetaRecord
  }
}

export type MockDb = IDBPDatabase<MockDbSchema>

// Conexão aberta por esta aba. Quando outra aba apaga o banco (reseed), o
// navegador pede para fechar a conexão (blocking); ela é zerada aqui e o
// próximo getDb() reabre o banco recriado.
let dbPromise: Promise<MockDb> | null = null
let connection: MockDb | null = null

function releaseConnection(): void {
  connection?.close()
  connection = null
  dbPromise = null
}

function openMockDb(): Promise<MockDb> {
  return openDB<MockDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('nfts', { keyPath: 'id' })
      db.createObjectStore('collections', { keyPath: 'id' })

      const users = db.createObjectStore('users', { keyPath: 'id' })
      users.createIndex('email', 'email', { unique: true })
      users.createIndex('username', 'username', { unique: true })

      db.createObjectStore('sessions', { keyPath: 'token' })
      db.createObjectStore('carts', { keyPath: 'id' })
      db.createObjectStore('quotes', { keyPath: 'id' })
      db.createObjectStore('orders', { keyPath: 'id' })
      db.createObjectStore('idempotency', { keyPath: 'key' })
      db.createObjectStore('favorites', { keyPath: ['userId', 'nftId'] })

      const wallets = db.createObjectStore('wallets', { keyPath: 'id' })
      wallets.createIndex('userId', 'userId')

      db.createObjectStore('avatars', { keyPath: 'userId' })

      const reviews = db.createObjectStore('reviews', { keyPath: 'id' })
      reviews.createIndex('nftId', 'nftId')

      db.createObjectStore('meta', { keyPath: 'key' })
    },
    blocking() {
      releaseConnection()
    },
    terminated() {
      connection = null
      dbPromise = null
    },
  }).then((db) => {
    connection = db
    return db
  })
}

export function getDb(): Promise<MockDb> {
  dbPromise ??= openMockDb()
  return dbPromise
}

export async function deleteMockDb(): Promise<void> {
  if (dbPromise) {
    // Abertura ainda em andamento: espera e fecha antes de apagar.
    const pending = dbPromise
    dbPromise = null
    await pending.then(
      (db) => db.close(),
      () => undefined,
    )
  }
  connection = null
  await deleteDB(DB_NAME)
}
