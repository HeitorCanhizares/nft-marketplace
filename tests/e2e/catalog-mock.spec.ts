import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp } from './helpers.ts'

// GET /home e GET /nfts do mock, exercitados por fetch dentro da página, sem nenhuma tela.
test.skip(({ isMobile }) => isMobile, 'o mock é o mesmo nos dois projetos; roda só no desktop')

type Result<T> = { status: number; body: T; failed?: boolean }

type ApiError = {
  error: {
    code: string
    message: string
    details: Record<string, unknown>
    fields?: Record<string, string>
  }
}

type Summary = {
  id: string
  name: string
  tokenId: string
  price: string
  previousPrice?: string
  network: string
  collection: { id: string; name: string }
  isFavorite?: boolean
  soldOut?: boolean
  defaultEditionId?: string
  stats?: unknown
  createdAt?: unknown
  editions?: unknown
}

type Facets = {
  collections: { id: string; name: string; count: number }[]
  networks: { id: string; name: string; count: number }[]
  priceRange: { min: string; max: string }
}

type Catalog = ApiError & {
  items: Summary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: Facets
}

type Home = ApiError & {
  hero: Summary[]
  featured: Summary
  promos: { query: Record<string, string> }[]
  posts: unknown[]
}

// Cópia do banco do mock, já com o preço em unidades inteiras (money.ethToUnits).
type Rec = {
  id: string
  name: string
  tokenId: string
  price: string
  units: number
  network: string
  collectionId: string
  collectionName: string
  attributes: string[]
  createdAt: string
  createdMs: number
  ratingAverage: number
  ratingCount: number
  favoritesTotal: number
  realFavorites: number
  editions: { id: string; label: string; available: number | null; price: string }[]
}

type CallOptions = { token?: string }

async function call<T>(page: Page, path: string, options: CallOptions = {}): Promise<Result<T>> {
  const args = JSON.stringify({ path, ...options })
  return page.evaluate<Result<T>>(`(async () => {
    const a = ${args}
    const headers = {}
    if (a.token) headers['Authorization'] = 'Bearer ' + a.token
    try {
      const response = await fetch('/api' + a.path, { headers })
      const text = await response.text()
      return { status: response.status, body: text === '' ? null : JSON.parse(text) }
    } catch {
      return { status: 0, body: null, failed: true }
    }
  })()`)
}

const nfts = (page: Page, query = '', options: CallOptions = {}) =>
  call<Catalog>(page, '/nfts' + (query === '' ? '' : '?' + query), options)

const home = (page: Page, options: CallOptions = {}) => call<Home>(page, '/home', options)

async function loginToken(page: Page, email: string, password: string): Promise<string> {
  const result = await page.evaluate<Result<{ session: { token: string } }>>(`(async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(${JSON.stringify({ email, password })}),
    })
    return { status: response.status, body: await response.json() }
  })()`)
  expect(result.status).toBe(200)
  return result.body.session.token
}

function setScenarios(page: Page, scenarios: string) {
  return page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`)
}

// Lê o banco inteiro do mock de uma vez, com os favoritos reais de cada usuário somados.
function snapshot(page: Page): Promise<Rec[]> {
  return page.evaluate<Rec[]>(`(async () => {
    const { stores, money } = window.__kurioMock
    const all = await stores.nftsStore.getAll()
    const realFavorites = new Map()
    for (const user of await stores.usersStore.getAll()) {
      for (const favorite of await stores.favoritesStore.listByUserId(user.id)) {
        realFavorites.set(favorite.nftId, (realFavorites.get(favorite.nftId) ?? 0) + 1)
      }
    }
    return all.map((n) => ({
      id: n.id,
      name: n.name,
      tokenId: n.tokenId,
      price: n.price,
      units: money.ethToUnits(n.price),
      network: n.network,
      collectionId: n.collection.id,
      collectionName: n.collection.name,
      attributes: n.attributes,
      createdAt: n.createdAt,
      createdMs: Date.parse(n.createdAt),
      ratingAverage: n.rating.average,
      ratingCount: n.rating.count,
      favoritesTotal: n.stats.favoritesTotal,
      realFavorites: realFavorites.get(n.id) ?? 0,
      editions: n.editions.map((e) => ({ id: e.id, label: e.label, available: e.available, price: e.price })),
    }))
  })()`)
}

function favoriteIdsOf(page: Page, userEmail: string): Promise<string[]> {
  return page.evaluate<string[]>(`(async () => {
    const { stores } = window.__kurioMock
    const user = (await stores.usersStore.getAll()).find((u) => u.email === ${JSON.stringify(userEmail)})
    return (await stores.favoritesStore.listByUserId(user.id)).map((f) => f.nftId)
  })()`)
}

const compareIds = (a: Rec, b: Rec) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

const byRecent = (a: Rec, b: Rec) => b.createdMs - a.createdMs || compareIds(a, b)

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
}

const hasWord = (rec: Rec, word: string) =>
  [rec.name, rec.tokenId, rec.collectionName, ...rec.attributes].some((text) =>
    normalize(text).includes(normalize(word)),
  )

const ids = (items: { id: string }[]) => items.map((item) => item.id)

const sum = (list: { count: number }[]) => list.reduce((total, item) => total + item.count, 0)

const counts = (list: { count: number }[]) => list.map((item) => item.count)

// Os 30 dias de "Novos" contam a partir do NFT mais recente do banco.
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

test.describe('GET /home', () => {
  test('visitante: 3 no hero, 1 destaque, 2 promos e 4 posts, sem isFavorite', async ({ page }) => {
    await openApp(page)
    const result = await home(page)
    expect(result.status).toBe(200)

    const valid = await page.evaluate(
      `window.__kurio.schemas.nft.homeResponseSchema.safeParse(${JSON.stringify(result.body)}).success`,
    )
    expect(valid).toBe(true)

    expect(result.body.hero).toHaveLength(3)
    expect(result.body.posts).toHaveLength(4)
    expect(result.body.promos).toHaveLength(2)
    expect(result.body.promos.map((promo) => promo.query)).toEqual([
      expect.objectContaining({ tab: 'new' }),
      expect.objectContaining({ collection: 'arte-digital' }),
    ])

    for (const nft of [...result.body.hero, result.body.featured]) {
      expect(typeof nft.soldOut).toBe('boolean')
      expect('isFavorite' in nft).toBe(false)
    }
  })

  test('com token, isFavorite é booleano em todos', async ({ page }) => {
    await openApp(page)
    const token = await loginToken(page, users.primary.email, users.primary.password)
    const result = await home(page, { token })
    expect(result.status).toBe(200)

    const favorites = await favoriteIdsOf(page, users.primary.email)
    for (const nft of [...result.body.hero, result.body.featured]) {
      expect(nft.isFavorite).toBe(favorites.includes(nft.id))
    }
  })

  test('token inválido em rota pública: responde 200 como visitante', async ({ page }) => {
    await openApp(page)
    const result = await home(page, { token: 'tok-invalido' })
    expect(result.status).toBe(200)
    expect('isFavorite' in result.body.featured).toBe(false)
  })
})

test.describe('GET /nfts: formato e abas', () => {
  test('padrão: 9 de 283 em 32 páginas, sem campos internos', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page)
    expect(result.status).toBe(200)

    const valid = await page.evaluate(
      `window.__kurio.schemas.nft.catalogResponseSchema.safeParse(${JSON.stringify(result.body)}).success`,
    )
    expect(valid).toBe(true)

    const { body } = result
    expect(body).toMatchObject({ page: 1, pageSize: 9, total: 283, totalPages: 32 })
    expect(body.items).toHaveLength(9)
    expect(body.items.slice(0, 3).map((item) => item.name)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
    ])
    for (const item of body.items) {
      expect(item).not.toHaveProperty('stats')
      expect(item).not.toHaveProperty('createdAt')
      expect(item).not.toHaveProperty('editions')
      expect(typeof item.soldOut).toBe('boolean')
    }

    expect(sum(body.facets.collections)).toBe(283)
    expect(sum(body.facets.networks)).toBe(283)
    expect(body.facets.priceRange.min).toMatch(/^\d+\.\d{2,}$/)
    expect(body.facets.priceRange.max).toMatch(/^\d+\.\d{2,}$/)
  })

  test('a ordem padrão é a do banco: mais recente primeiro, empate por id', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const expected = [...db].sort(byRecent)
    const result = await nfts(page, 'pageSize=300')
    expect(ids(result.body.items)).toEqual(ids(expected))
  })

  test('tab=new e tab=trending; tab=all é igual ao padrão', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)

    const novos = await nfts(page, 'tab=new&pageSize=300')
    expect(novos.body.total).toBe(39)
    const reference = Math.max(...db.map((rec) => rec.createdMs))
    const created = new Map(db.map((rec) => [rec.id, rec.createdMs]))
    for (const item of novos.body.items) {
      expect(created.get(item.id)).toBeGreaterThanOrEqual(reference - NEW_WINDOW_MS)
    }
    const expectedNew = db.filter((rec) => rec.createdMs >= reference - NEW_WINDOW_MS)
    expect(novos.body.total).toBe(expectedNew.length)

    const emAlta = await nfts(page, 'tab=trending')
    expect(emAlta.body.total).toBe(48)

    const all = await nfts(page, 'tab=all')
    const padrao = await nfts(page)
    expect(all.body).toEqual(padrao.body)
  })
})

test.describe('GET /nfts: filtros e facets', () => {
  test('coleção, rede e combinação', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)

    const musica = await nfts(page, 'collection=musica')
    expect(musica.body.total).toBe(77)

    const solana = await nfts(page, 'network=solana')
    expect(solana.body.total).toBe(86)

    const both = await nfts(page, 'collection=musica&network=solana&pageSize=300')
    const expected = db.filter((rec) => rec.collectionId === 'musica' && rec.network === 'solana')
    expect(expected.length).toBeGreaterThan(0)
    expect(both.body.total).toBe(expected.length)
    expect(new Set(ids(both.body.items))).toEqual(new Set(ids(expected)))
  })

  test('faixa de preço mantém só os NFTs dentro dela', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const prices = db.map((rec) => rec.units).sort((a, b) => a - b)
    const min = prices[Math.floor(prices.length * 0.25)]
    const max = prices[Math.floor(prices.length * 0.75)]
    const toEth = (units: number) => (units / 1_000_000).toFixed(6)

    const result = await nfts(page, `minPrice=${toEth(min)}&maxPrice=${toEth(max)}&pageSize=300`)
    const expected = db.filter((rec) => rec.units >= min && rec.units <= max)
    expect(result.body.total).toBe(expected.length)

    const units = await page.evaluate<number[]>(
      `${JSON.stringify(result.body.items.map((item) => item.price))}.map((p) => window.__kurioMock.money.ethToUnits(p))`,
    )
    expect(units.length).toBe(expected.length)
    for (const value of units) {
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThanOrEqual(max)
    }
  })

  test('todos os filtros juntos dão a interseção', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const reference = Math.max(...db.map((rec) => rec.createdMs))

    const expected = db.filter(
      (rec) =>
        hasWord(rec, 'a') &&
        rec.createdMs >= reference - NEW_WINDOW_MS &&
        rec.network === 'ethereum' &&
        rec.units >= 500_000 &&
        rec.units <= 5_000_000,
    )
    expect(expected.length).toBeGreaterThan(0)

    const result = await nfts(
      page,
      'q=a&tab=new&network=ethereum&minPrice=0.5&maxPrice=5&pageSize=300',
    )
    expect(result.body.total).toBe(expected.length)
    expect(new Set(ids(result.body.items))).toEqual(new Set(ids(expected)))
  })

  test('facets: o grupo da rede se ignora e as coleções acompanham a rede', async ({ page }) => {
    await openApp(page)
    const base = await nfts(page)
    expect(counts(base.body.facets.collections).slice(0, 9)).toEqual([
      39, 14, 77, 46, 27, 20, 23, 16, 21,
    ])
    expect(counts(base.body.facets.networks)).toEqual([119, 78, 86])
    const names = base.body.facets.collections.map((collection) => collection.name)
    expect(names.slice(0, 4)).toEqual(['Arte digital', 'Fotografia', 'Música', 'Arte 3D'])

    const ethereum = await nfts(page, 'network=ethereum')
    expect(sum(ethereum.body.facets.collections)).toBe(119)
    expect(counts(ethereum.body.facets.networks)).toEqual([119, 78, 86])

    const musica = await nfts(page, 'collection=musica')
    expect(sum(musica.body.facets.networks)).toBe(77)
    expect(counts(musica.body.facets.collections).slice(0, 3)).toEqual([39, 14, 77])
    expect(musica.body.facets.collections.map((collection) => collection.name)).toEqual(names)
  })

  test('facets: a faixa de preço não muda com filtros', async ({ page }) => {
    await openApp(page)
    const base = await nfts(page)
    for (const query of [
      'collection=musica',
      'network=solana&tab=new',
      'minPrice=1&maxPrice=2',
      'q=zzzz',
    ]) {
      const filtered = await nfts(page, query)
      expect(filtered.body.facets.priceRange).toEqual(base.body.facets.priceRange)
    }
    const db = await snapshot(page)
    const units = db.map((rec) => rec.units)
    expect(base.body.facets.priceRange.min).toBe(
      db.find((rec) => rec.units === Math.min(...units))?.price,
    )
    expect(base.body.facets.priceRange.max).toBe(
      db.find((rec) => rec.units === Math.max(...units))?.price,
    )
  })
})

test.describe('GET /nfts: ordenação', () => {
  test('price_asc e price_desc', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const asc = await nfts(page, 'sort=price_asc&pageSize=300')
    const desc = await nfts(page, 'sort=price_desc&pageSize=300')
    expect(ids(asc.body.items)).toEqual(
      ids([...db].sort((a, b) => a.units - b.units || compareIds(a, b))),
    )
    expect(ids(desc.body.items)).toEqual(
      ids([...db].sort((a, b) => b.units - a.units || compareIds(a, b))),
    )
  })

  test('top_rated: nota decrescente, empate por id', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const byId = new Map(db.map((rec) => [rec.id, rec]))
    const result = await nfts(page, 'sort=top_rated&pageSize=300')
    const list = result.body.items.map((item) => byId.get(item.id)!)
    expect(list).toHaveLength(283)
    for (let i = 1; i < list.length; i++) {
      const [previous, current] = [list[i - 1], list[i]]
      expect(previous.ratingAverage).toBeGreaterThanOrEqual(current.ratingAverage)
      if (
        previous.ratingAverage === current.ratingAverage &&
        previous.ratingCount === current.ratingCount
      ) {
        expect(compareIds(previous, current)).toBeLessThan(0)
      }
    }
  })

  test('most_favorited: favoritos do seed mais os reais, empate por id', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const total = (rec: Rec) => rec.favoritesTotal + rec.realFavorites
    const expected = [...db].sort((a, b) => total(b) - total(a) || compareIds(a, b))
    const result = await nfts(page, 'sort=most_favorited&pageSize=300')
    expect(ids(result.body.items)).toEqual(ids(expected))
  })

  test('recent: createdAt decrescente, e duas chamadas dão a mesma ordem', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const first = await nfts(page, 'sort=recent&pageSize=300')
    const second = await nfts(page, 'sort=recent&pageSize=300')
    expect(ids(first.body.items)).toEqual(ids([...db].sort(byRecent)))
    expect(ids(second.body.items)).toEqual(ids(first.body.items))
  })
})

test.describe('GET /nfts: busca', () => {
  test('q=ape só traz nomes, coleções ou atributos com "ape"', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const byId = new Map(db.map((rec) => [rec.id, rec]))
    const result = await nfts(page, 'q=ape&pageSize=300')
    const expected = db.filter((rec) => hasWord(rec, 'ape'))
    expect(expected.length).toBeGreaterThan(0)
    expect(result.body.total).toBe(expected.length)
    for (const item of result.body.items) {
      expect(hasWord(byId.get(item.id)!, 'ape')).toBe(true)
    }
  })

  test('q=musica, sem acento, acha a coleção "Música"', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'q=musica')
    expect(result.body.total).toBeGreaterThanOrEqual(77)
    const accent = await nfts(page, 'q=M%C3%BAsica')
    expect(accent.body.total).toBe(result.body.total)
    const upper = await nfts(page, 'q=MUSICA')
    expect(upper.body.total).toBe(result.body.total)
  })

  test('q=#0042 e q=0042 acham o #0042', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const expected = db.filter((rec) => hasWord(rec, '0042'))
    expect(expected.length).toBeGreaterThan(0)
    expect(expected.some((rec) => rec.tokenId === '#0042')).toBe(true)

    const hash = await nfts(page, 'q=%230042&pageSize=300')
    const bare = await nfts(page, 'q=0042&pageSize=300')
    expect(new Set(ids(hash.body.items))).toEqual(new Set(ids(expected)))
    expect(ids(bare.body.items)).toEqual(ids(hash.body.items))
  })

  test('q=zzzz: 200 com lista vazia, total 0 e 0 páginas', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'q=zzzz')
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ items: [], total: 0, totalPages: 0 })
  })
})

test.describe('GET /nfts: paginação', () => {
  test('page=2 traz os itens 10 a 18 da lista', async ({ page }) => {
    await openApp(page)
    const all = await nfts(page, 'pageSize=300')
    const second = await nfts(page, 'page=2')
    expect(second.body.page).toBe(2)
    expect(ids(second.body.items)).toEqual(ids(all.body.items.slice(9, 18)))
  })

  test('pageSize=18 é igual às páginas 1 e 2 de 9', async ({ page }) => {
    await openApp(page)
    const big = await nfts(page, 'pageSize=18&page=1')
    const first = await nfts(page, 'page=1')
    const second = await nfts(page, 'page=2')
    expect(big.body.pageSize).toBe(18)
    expect(ids(big.body.items)).toEqual([...ids(first.body.items), ...ids(second.body.items)])
  })

  test('page=99 devolve 200 com lista vazia', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'page=99')
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ items: [], page: 99, total: 283, totalPages: 32 })
  })

  test('pageSize=300 é aceito', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'pageSize=300')
    expect(result.status).toBe(200)
    expect(result.body.items).toHaveLength(283)
    expect(result.body.totalPages).toBe(1)
  })
})

test.describe('GET /nfts: validação', () => {
  const cases: [string, string][] = [
    ['page=0', 'page'],
    ['page=abc', 'page'],
    ['pageSize=301', 'pageSize'],
    ['tab=x', 'tab'],
    ['sort=y', 'sort'],
    ['network=bitcoin', 'network'],
    ['minPrice=abc', 'minPrice'],
    ['minPrice=2&maxPrice=1', 'maxPrice'],
    ['favorites=2', 'favorites'],
  ]

  for (const [query, field] of cases) {
    test(`${query} devolve 422 com o campo ${field}`, async ({ page }) => {
      await openApp(page)
      const result = await nfts(page, query)
      expect(result.status).toBe(422)
      expect(result.body.error.code).toBe('VALIDATION_ERROR')
      expect(Object.keys(result.body.error.fields ?? {})).toContain(field)
    })
  }
})

test.describe('GET /nfts: favoritos', () => {
  test('favorites=1 sem token devolve 401 UNAUTHORIZED', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'favorites=1')
    expect(result.status).toBe(401)
    expect(result.body.error.code).toBe('UNAUTHORIZED')
  })

  test('favorites=1 com token traz os 12 favoritos, e q filtra dentro deles', async ({ page }) => {
    await openApp(page)
    const db = await snapshot(page)
    const token = await loginToken(page, users.primary.email, users.primary.password)
    const favorites = await favoriteIdsOf(page, users.primary.email)
    expect(favorites).toHaveLength(12)

    const result = await nfts(page, 'favorites=1&pageSize=300', { token })
    expect(result.status).toBe(200)
    expect(result.body.total).toBe(12)
    expect(new Set(ids(result.body.items))).toEqual(new Set(favorites))
    for (const item of result.body.items) expect(item.isFavorite).toBe(true)

    const expected = db.filter((rec) => favorites.includes(rec.id) && hasWord(rec, 'ape'))
    const filtered = await nfts(page, 'favorites=1&q=ape&pageSize=300', { token })
    expect(new Set(ids(filtered.body.items))).toEqual(new Set(ids(expected)))
    expect(filtered.body.total).toBeLessThan(12)
  })

  test('sem favorites: token marca isFavorite; visitante não tem a chave', async ({ page }) => {
    await openApp(page)
    const token = await loginToken(page, users.primary.email, users.primary.password)
    const favorites = await favoriteIdsOf(page, users.primary.email)

    const logged = await nfts(page, 'pageSize=300', { token })
    expect(logged.body.total).toBe(283)
    for (const item of logged.body.items) expect(item.isFavorite).toBe(favorites.includes(item.id))

    const guest = await nfts(page, 'pageSize=300')
    for (const item of guest.body.items) expect(item).not.toHaveProperty('isFavorite')
  })

  test('token inválido sem favorites: 200 como visitante', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, '', { token: 'tok-invalido' })
    expect(result.status).toBe(200)
    expect(result.body.items[0]).not.toHaveProperty('isFavorite')
  })

  test('token inválido com favorites=1: 401', async ({ page }) => {
    await openApp(page)
    const result = await nfts(page, 'favorites=1', { token: 'tok-invalido' })
    expect(result.status).toBe(401)
  })
})

test.describe('cenários', () => {
  test('empty-catalog: lista vazia, facets zerados e /home continua 200', async ({ page }) => {
    await openApp(page, 'empty-catalog')
    const result = await nfts(page)
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ items: [], total: 0, totalPages: 0 })
    expect(result.body.facets.priceRange).toEqual({ min: '0.00', max: '0.00' })
    expect(result.body.facets.collections.length).toBeGreaterThan(0)
    expect(counts(result.body.facets.collections).every((count) => count === 0)).toBe(true)
    expect(result.body.facets.networks).toHaveLength(3)
    expect(counts(result.body.facets.networks)).toEqual([0, 0, 0])

    expect((await home(page)).status).toBe(200)
  })

  test('server-error:GET /nfts: 500 só no catálogo', async ({ page }) => {
    await openApp(page, 'server-error:GET /nfts')
    const result = await nfts(page)
    expect(result.status).toBe(500)
    expect(result.body.error.code).toBe('INTERNAL_ERROR')
    expect((await home(page)).status).toBe(200)
  })

  test('server-error:GET /home: 500 só no início', async ({ page }) => {
    await openApp(page, 'server-error:GET /home')
    const result = await home(page)
    expect(result.status).toBe(500)
    expect(result.body.error.code).toBe('INTERNAL_ERROR')
    expect((await nfts(page)).status).toBe(200)
  })

  test('offline: a requisição falha na rede', async ({ page }) => {
    await openApp(page, 'offline')
    const catalog = await nfts(page)
    expect(catalog.failed).toBe(true)
    const start = await home(page)
    expect(start.failed).toBe(true)
  })

  test('session-expired: favorites=1 devolve 401 SESSION_EXPIRED, o catálogo público segue 200', async ({
    page,
  }) => {
    await openApp(page)
    const token = await loginToken(page, users.primary.email, users.primary.password)
    await setScenarios(page, 'session-expired')

    const favorites = await nfts(page, 'favorites=1', { token })
    expect(favorites.status).toBe(401)
    expect(favorites.body.error.code).toBe('SESSION_EXPIRED')

    expect((await nfts(page, '', { token })).status).toBe(200)
    expect((await nfts(page)).status).toBe(200)
  })
})

test.describe('consistência com o tempo real', () => {
  test('triggerPriceChange muda price e previousPrice no catálogo', async ({ page }) => {
    await openApp(page)
    const before = (await nfts(page, 'q=emerald&pageSize=300')).body.items.find(
      (item) => item.id === 'emerald-ape-042',
    )
    expect(before).toBeDefined()

    await page.evaluate(`(async () => {
      const nft = await window.__kurioMock.stores.nftsStore.get('emerald-ape-042')
      const edition = nft.editions.find((e) => e.available !== 0)
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', edition.id, '0.01')
    })()`)

    const stored = (await snapshot(page)).find((rec) => rec.id === 'emerald-ape-042')!
    const after = (await nfts(page, 'q=emerald&pageSize=300')).body.items.find(
      (item) => item.id === 'emerald-ape-042',
    )!
    expect(after.price).toBe(stored.price)
    expect(after.price).not.toBe(before!.price)
    expect(after.previousPrice).toBeDefined()
  })

  test('sem estoque em todas as edições limitadas: soldOut só se não houver edição aberta', async ({
    page,
  }) => {
    await openApp(page)
    const db = await snapshot(page)
    const open = db.find((rec) => rec.editions.some((e) => e.available === null))!
    const limitedOnly = db.find(
      (rec) =>
        rec.editions.every((e) => e.available !== null) &&
        rec.editions.some((e) => e.available !== 0),
    )

    const zeroLimited = (rec: Rec) =>
      page.evaluate(`(async () => {
        const { triggerStockChange, stores } = window.__kurioMock
        const nft = await stores.nftsStore.get(${JSON.stringify(rec.id)})
        for (const e of nft.editions) if (e.available !== null) await triggerStockChange(nft.id, e.id, 0)
      })()`)

    const find = async (rec: Rec) =>
      (await nfts(page, `q=${encodeURIComponent(rec.name)}&pageSize=300`)).body.items.find(
        (item) => item.id === rec.id,
      )!

    // Com edição ABERTA o NFT nunca esgota, mesmo zerando as limitadas.
    await zeroLimited(open)
    const stillOpen = await find(open)
    expect(stillOpen.soldOut).toBe(false)
    expect(stillOpen.defaultEditionId).toBeDefined()

    if (limitedOnly !== undefined) {
      await zeroLimited(limitedOnly)
      const soldOut = await find(limitedOnly)
      expect(soldOut.soldOut).toBe(true)
      expect(soldOut).not.toHaveProperty('defaultEditionId')
    }
  })
})
