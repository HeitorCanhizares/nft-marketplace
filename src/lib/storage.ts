export const STORAGE_KEYS = {
  session: 'kurio:session',
  guestCartId: 'kurio:guest-cart-id',
  mockScenarios: 'kurio:mock:scenarios',
  checkout: 'kurio:checkout',
  checkoutDraft: 'kurio:checkout-draft',
} as const

export interface KeyValueStorage {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
  getJson<T>(key: string): T | null
  setJson<T>(key: string, value: T): void
}

function createKeyValueStorage(getNative: () => Storage): KeyValueStorage {
  // Valores que não foram persistidos no storage nativo (`null` = removido).
  // Só é consultado quando o nativo falha, então a sessão continua funcionando.
  const memory = new Map<string, string | null>()

  function get(key: string): string | null {
    if (memory.has(key)) return memory.get(key) ?? null
    try {
      return getNative().getItem(key)
    } catch {
      return null
    }
  }

  function set(key: string, value: string): void {
    try {
      getNative().setItem(key, value)
      memory.delete(key)
    } catch {
      memory.set(key, value)
    }
  }

  function remove(key: string): void {
    try {
      getNative().removeItem(key)
      memory.delete(key)
    } catch {
      memory.set(key, null)
    }
  }

  function getJson<T>(key: string): T | null {
    const raw = get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  function setJson<T>(key: string, value: T): void {
    set(key, JSON.stringify(value))
  }

  return { get, set, remove, getJson, setJson }
}

export const storage = {
  local: createKeyValueStorage(() => window.localStorage),
  session: createKeyValueStorage(() => window.sessionStorage),
}
