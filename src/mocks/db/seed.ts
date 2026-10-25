import { STORAGE_KEYS, storage } from '../../lib/storage'
import { isTestMode, mockConfig } from '../scenarios/config'
import { SEED_IMAGE_URLS } from '../seed/nfts'
import { buildSeedData, SEED_VERSION } from '../seed'
import { deleteMockDb, getDb, type MockDbSchema } from './db'
import { metaStore } from './stores'

const SEED_VERSION_KEY = 'seedVersion'

export type SeedSummary = {
  seeded: boolean
  counts: Record<string, number>
}

// As URLs das imagens têm hash no build: se mudarem, o banco persistido ficaria com image.src quebrado.
function effectiveSeedVersion(): string {
  return `${SEED_VERSION}:${SEED_IMAGE_URLS.join(',')}`
}

type WritableStore = 'collections' | 'users' | 'wallets' | 'nfts' | 'reviews' | 'favorites'

export async function ensureSeeded(): Promise<SeedSummary> {
  const expected = effectiveSeedVersion()
  const current = await metaStore.get(SEED_VERSION_KEY)
  // O reset por variável vale uma vez por sessão da aba: um reload da mesma aba preserva os dados.
  const resetByEnv =
    mockConfig.seedReset && storage.session.get(STORAGE_KEYS.mockSeedResetDone) === null

  if (!resetByEnv && current?.value === expected) {
    return { seeded: false, counts: {} }
  }

  await deleteMockDb()
  const db = await getDb()
  const data = buildSeedData()
  const counts: Record<string, number> = {}

  // Uma transação por store; a versão só é gravada depois de todas, então uma falha no meio refaz o seed.
  const write = async <S extends WritableStore>(
    name: S,
    records: MockDbSchema[S]['value'][],
  ): Promise<void> => {
    const tx = db.transaction(name, 'readwrite')
    await Promise.all([...records.map((record) => tx.store.put(record)), tx.done])
    counts[name] = records.length
  }

  await write('collections', data.collections)
  await write('users', data.users)
  await write('wallets', data.wallets)
  await write('nfts', data.nfts)
  await write('reviews', data.reviews)
  await write('favorites', data.favorites)
  await metaStore.put({ key: SEED_VERSION_KEY, value: expected })
  if (resetByEnv) {
    storage.session.set(STORAGE_KEYS.mockSeedResetDone, '1')
  }

  if (!isTestMode) {
    console.info(`[mock] seed v${SEED_VERSION} gravado: ${JSON.stringify(counts)}`)
  }

  return { seeded: true, counts }
}
