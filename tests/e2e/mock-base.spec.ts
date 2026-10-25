import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'

const SOCKET_CLIENT = 'node_modules/socket.io-client/dist/socket.io.min.js'

async function openApp(page: Page, scenarios?: string) {
  if (scenarios !== undefined) {
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`,
    )
  }
  await page.goto('/')
  await page.waitForFunction('Boolean(window.__kurioMock)')
}

async function callHealth(page: Page) {
  return page.evaluate<{ status: number; ms: number; error: boolean; body?: unknown }>(`
    (async () => {
      const t = performance.now()
      try {
        const r = await fetch('/api/health')
        const body = await r.json().catch(() => undefined)
        return { status: r.status, ms: performance.now() - t, error: false, body }
      } catch {
        return { status: 0, ms: performance.now() - t, error: true }
      }
    })()
  `)
}

function idb<T>(page: Page, body: string) {
  return page.evaluate<T>(`
    (async () => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('kurio-mock-db')
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const all = (store) => new Promise((resolve, reject) => {
        const req = db.transaction(store).objectStore(store).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const get = (store, key) => new Promise((resolve, reject) => {
        const req = db.transaction(store).objectStore(store).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const put = (store, value) => new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).put(value)
        tx.oncomplete = () => resolve(undefined)
        tx.onerror = () => reject(tx.error)
      })
      try { return await (async () => { ${body} })() } finally { db.close() }
    })()
  `)
}

test.describe('ambiente e middleware', () => {
  test('o modo test carrega o .env.test (latência fixa baixa)', async ({ page }) => {
    await openApp(page)
    const times: number[] = []
    for (let i = 0; i < 5; i++) {
      const r = await callHealth(page)
      expect(r.status).toBe(200)
      times.push(r.ms)
    }
    times.sort((a, b) => a - b)
    // O padrão de .env é 200–1200 ms; abaixo de 190 ms só com o .env.test (50 ms)
    expect(times[2]).toBeLessThan(190)
  })

  test('o service worker controla a página antes do app montar', async ({ page }) => {
    await openApp(page)
    expect(await page.evaluate('Boolean(navigator.serviceWorker.controller)')).toBe(true)
  })

  test('a saúde responde com o banco populado', async ({ page }) => {
    await openApp(page)
    const r = await callHealth(page)
    expect(r.body).toMatchObject({ status: 'ok', seeded: true })
  })

  test('cenário slow aumenta a latência', async ({ page }) => {
    await openApp(page, 'slow')
    const r = await callHealth(page)
    expect(r.status).toBe(200)
    expect(r.ms).toBeGreaterThanOrEqual(1900)
  })

  test('cenário offline derruba a conexão', async ({ page }) => {
    await openApp(page, 'offline')
    expect((await callHealth(page)).error).toBe(true)
  })

  for (const [scenario, status, code] of [
    ['server-error:GET /health', 500, 'INTERNAL_ERROR'],
    ['unavailable:GET /health', 503, 'SERVICE_UNAVAILABLE'],
    ['not-found:GET /health', 404, 'NOT_FOUND'],
  ] as const) {
    test(`cenário ${scenario}`, async ({ page }) => {
      await openApp(page, scenario)
      const r = await callHealth(page)
      expect(r.status).toBe(status)
      expect(r.body).toMatchObject({ error: { code } })
    })
  }

  test('o override do localStorage vale com a página já aberta', async ({ page }) => {
    await openApp(page)
    expect((await callHealth(page)).status).toBe(200)
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'server-error:GET /health')`)
    expect((await callHealth(page)).status).toBe(500)
  })

  test('com o storage bloqueado a página ainda carrega', async ({ page }) => {
    await page.addInitScript(`Storage.prototype.setItem = () => { throw new Error('blocked') }`)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Kurio' })).toBeVisible()
  })
})

test.describe('banco e seed', () => {
  test('as 13 stores existem com os dados do seed', async ({ page }) => {
    await openApp(page)
    const info = await idb<{
      stores: string[]
      counts: Record<string, number>
      networks: Record<string, number>
      collections: Record<string, number>
    }>(
      page,
      `
      const stores = [...db.objectStoreNames].sort()
      const counts = {}
      for (const s of ['nfts','collections','users','wallets','reviews','favorites','meta']) counts[s] = (await all(s)).length
      const nfts = await all('nfts')
      const networks = {}, collections = {}
      for (const n of nfts) { networks[n.network] = (networks[n.network] ?? 0) + 1; collections[n.collection.id] = (collections[n.collection.id] ?? 0) + 1 }
      return { stores, counts, networks, collections }
    `,
    )
    expect(info.stores).toEqual(
      [
        'avatars',
        'carts',
        'collections',
        'favorites',
        'idempotency',
        'meta',
        'nfts',
        'orders',
        'quotes',
        'reviews',
        'sessions',
        'users',
        'wallets',
      ].sort(),
    )
    expect(info.counts).toMatchObject({
      nfts: 283,
      collections: 9,
      users: 2,
      wallets: 1,
      favorites: 12,
    })
    expect(info.networks).toEqual({ ethereum: 119, polygon: 78, solana: 86 })
    expect(Object.values(info.collections).reduce((a, b) => a + b, 0)).toBe(283)
    expect(Object.keys(info.collections)).toHaveLength(9)
  })

  test('avaliações batem com rating.count e há esgotados, raros e recentes', async ({ page }) => {
    await openApp(page)
    const r = await idb<{
      mismatches: number
      soldOut: number
      rare: number
      previous: number
      recent: number
    }>(
      page,
      `
      const nfts = await all('nfts'), reviews = await all('reviews')
      const byNft = {}
      for (const v of reviews) (byNft[v.nftId] ??= []).push(v.rating)
      let mismatches = 0
      for (const n of nfts) {
        const list = byNft[n.id] ?? []
        if (list.length !== n.rating.count) mismatches++
        else if (list.length) {
          const avg = Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1))
          if (avg !== n.rating.average) mismatches++
        }
      }
      const limit = Date.now() - 30 * 86400000
      return {
        mismatches,
        soldOut: nfts.filter((n) => n.editions.every((e) => e.available === 0)).length,
        rare: nfts.filter((n) => n.rarity === 'rare').length,
        previous: nfts.filter((n) => n.previousPrice).length,
        recent: nfts.filter((n) => new Date(n.createdAt).getTime() >= Date.parse('2026-09-25T12:00:00Z')).length,
      }
    `,
    )
    expect(r.mismatches).toBe(0)
    expect(r.soldOut).toBeGreaterThan(0)
    expect(r.rare).toBeGreaterThanOrEqual(5)
    expect(r.previous).toBeGreaterThanOrEqual(8)
    expect(r.recent).toBeGreaterThanOrEqual(30)
  })

  test('reload da mesma aba preserva dados; aba nova começa limpa', async ({ page, context }) => {
    await openApp(page)
    await idb(page, `await put('meta', { key: 'probe', value: 'x' })`)
    await page.reload()
    await page.waitForFunction('Boolean(window.__kurioMock)')
    expect(await idb(page, `return (await get('meta', 'probe'))?.value`)).toBe('x')

    const fresh = await context.newPage()
    await fresh.goto('/')
    await fresh.waitForFunction('Boolean(window.__kurioMock)')
    // Mesmo contexto compartilha o IndexedDB: a aba nova (sessionStorage novo) recria o seed
    expect(await idb(fresh, `return (await get('meta', 'probe'))?.value`)).toBeUndefined()
  })

  test('a senha nunca fica em texto e o hash verifica', async ({ page }) => {
    await openApp(page)
    const json = await idb<string>(page, `return JSON.stringify(await all('users'))`)
    expect(json).not.toContain(users.primary.password)
    expect(json).not.toContain(users.other.password)
    const ok = await page.evaluate<{ right: boolean; wrong: boolean; distinct: boolean }>(
      `(async () => {
        const { hashPassword, verifyPassword } = window.__kurioMock.password
        const a = await hashPassword('Abc12345'), b = await hashPassword('Abc12345')
        return { right: await verifyPassword('Abc12345', a), wrong: await verifyPassword('Abc12346', a), distinct: a.salt !== b.salt && a.hash !== b.hash }
      })()`,
    )
    expect(ok).toEqual({ right: true, wrong: false, distinct: true })
  })

  test('as senhas fictícias dos usuários do seed conferem com o hash', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<boolean[]>(
      `(async () => {
        const { stores, password } = window.__kurioMock
        const out = []
        for (const [email, pwd] of [['${users.primary.email}', '${users.primary.password}'], ['${users.other.email}', '${users.other.password}']]) {
          const u = await stores.usersStore.getByEmail(email)
          out.push(await password.verifyPassword(pwd, { salt: u.passwordSalt, hash: u.passwordHash }))
        }
        return out
      })()`,
    )
    expect(r).toEqual([true, true])
  })

  test('o snapshot do pedido não muda depois de criado', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<{ total: string; status: string; txHash?: string }>(
      `(async () => {
        const { ordersStore } = window.__kurioMock.stores
        const base = { id: 'o1', userId: 'user-teste', status: 'pending', createdAt: '2026-10-25T00:00:00Z', quoteId: 'q', network: 'ethereum',
          wallet: { label: 'x', provider: 'metamask', address: '0x' + 'a'.repeat(40) }, collector: {}, items: [], subtotal: '1.00', discount: '0.00',
          networkFee: '0.01', total: '1.01' }
        await ordersStore.put(base)
        await ordersStore.put({ ...base, total: '999.00', status: 'confirmed', txHash: '0xabc' })
        const saved = await ordersStore.get('o1')
        return { total: saved.total, status: saved.status, txHash: saved.txHash }
      })()`,
    )
    expect(r).toEqual({ total: '1.01', status: 'confirmed', txHash: '0xabc' })
  })
})

test.describe('carteira simulada', () => {
  async function connect(
    page: Page,
    scenario?: string,
    provider = 'metamask',
    network = 'ethereum',
  ) {
    await openApp(page, scenario)
    return page.evaluate<{
      ms: number
      ok: boolean
      address?: string
      network?: string
      code?: string
    }>(
      `(async () => {
        const w = window.__kurioMock.createMockWalletProvider()
        const t = performance.now()
        try {
          const c = await w.connect('${provider}', '${network}')
          return { ms: performance.now() - t, ok: true, address: c.address, network: c.network }
        } catch (e) { return { ms: performance.now() - t, ok: false, code: e.code } }
      })()`,
    )
  }

  test('conexão padrão: atraso de 0,8 a 1,5 s e endereço válido', async ({ page }) => {
    const r = await connect(page)
    expect(r.ok).toBe(true)
    expect(r.ms).toBeGreaterThanOrEqual(750)
    expect(r.ms).toBeLessThanOrEqual(1700)
    expect(r.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(r.network).toBe('ethereum')
  })

  test('conecta com o endereço da carteira cadastrada do usuário', async ({ page }) => {
    await openApp(page)
    await idb(
      page,
      `await put('sessions', { token: 't1', userId: 'user-teste', expiresAt: '2099-01-01T00:00:00Z' })`,
    )
    await page.evaluate(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 't1', expiresAt: '2099-01-01T00:00:00Z' }))`,
    )
    const r = await page.evaluate<string>(
      `(async () => (await window.__kurioMock.createMockWalletProvider().connect('metamask', 'ethereum')).address)()`,
    )
    expect(r.toLowerCase()).toMatch(/^0xa91f.*e82c$/)
  })

  test('wallet-rejected', async ({ page }) => {
    const r = await connect(page, 'wallet-rejected')
    expect(r).toMatchObject({ ok: false, code: 'USER_REJECTED' })
  })

  test('wallet-wrong-network conecta em outra rede', async ({ page }) => {
    const r = await connect(page, 'wallet-wrong-network')
    expect(r.ok).toBe(true)
    expect(r.network).not.toBe('ethereum')
  })

  test('wallet-disconnect emite disconnect depois de conectar', async ({ page }) => {
    await openApp(page, 'wallet-disconnect')
    const r = await page.evaluate<boolean>(
      `new Promise(async (resolve) => {
        const w = window.__kurioMock.createMockWalletProvider()
        w.on('disconnect', () => resolve(true))
        await w.connect('metamask', 'ethereum')
        setTimeout(() => resolve(false), 8000)
      })`,
    )
    expect(r).toBe(true)
  })

  test('wallet-sign-rejected e assinatura normal', async ({ page }) => {
    await openApp(page, 'wallet-sign-rejected')
    const rejected = await page.evaluate<string>(
      `window.__kurioMock.createMockWalletProvider().signOrder('o1').then(() => 'ok', (e) => e.code)`,
    )
    expect(rejected).toBe('SIGN_REJECTED')
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    const ok = await page.evaluate<string>(
      `window.__kurioMock.createMockWalletProvider().signOrder('o1').then(() => 'ok', (e) => e.code)`,
    )
    expect(ok).toBe('ok')
  })

  test('switchNetwork emite chainChanged', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<string>(
      `(async () => {
        const w = window.__kurioMock.createMockWalletProvider()
        await w.connect('metamask', 'ethereum')
        return new Promise((resolve) => { w.on('chainChanged', resolve); w.switchNetwork('polygon') })
      })()`,
    )
    expect(r).toBe('polygon')
  })
})

test.describe('tempo real', () => {
  async function connectSocket(page: Page) {
    await openApp(page)
    await page.addScriptTag({ path: SOCKET_CLIENT })
  }

  const editionOf = (page: Page, id: string) =>
    idb<string>(page, `return (await get('nfts', '${id}')).editions[0].id`)

  test('inscrito recebe nft:price_changed; não inscrito não recebe', async ({ page }) => {
    await connectSocket(page)
    const edition = await editionOf(page, 'emerald-ape-042')
    const r = await page.evaluate<{ subscribed: unknown[]; other: unknown[] }>(
      `new Promise((resolve) => {
        const a = io({ transports: ['websocket'] }), b = io({ transports: ['websocket'] })
        const subscribed = [], other = []
        a.on('nft:price_changed', (p) => subscribed.push(p))
        b.on('nft:price_changed', (p) => other.push(p))
        let ready = 0
        const go = async () => {
          if (++ready < 2) return
          a.emit('nft:subscribe', { ids: ['emerald-ape-042'] })
          b.emit('nft:subscribe', { ids: ['sage-nomad-009'] })
          await new Promise((r) => setTimeout(r, 300))
          await window.__kurioMock.triggerPriceChange('emerald-ape-042', '${edition}', '9.99')
          await new Promise((r) => setTimeout(r, 600))
          resolve({ subscribed, other })
        }
        a.on('connect', go); b.on('connect', go)
      })`,
    )
    expect(r.other).toEqual([])
    expect(r.subscribed).toHaveLength(1)
    expect(r.subscribed[0]).toMatchObject({
      nftId: 'emerald-ape-042',
      editionId: edition,
      price: '9.99',
    })
    const saved = await idb<string>(
      page,
      `return (await get('nfts', 'emerald-ape-042')).editions[0].price`,
    )
    expect(saved).toBe('9.99')
  })

  test('mudança de estoque chega ao inscrito e é gravada', async ({ page }) => {
    await connectSocket(page)
    const edition = await idb<string>(
      page,
      `return (await get('nfts', 'sage-nomad-009')).editions.find((e) => e.available !== null && e.available > 0).id`,
    )
    const r = await page.evaluate<unknown[]>(
      `new Promise((resolve) => {
        const s = io({ transports: ['websocket'] }), got = []
        s.on('nft:stock_changed', (p) => got.push(p))
        s.on('connect', async () => {
          s.emit('nft:subscribe', { ids: ['sage-nomad-009'] })
          await new Promise((r) => setTimeout(r, 300))
          await window.__kurioMock.triggerStockChange('sage-nomad-009', '${edition}', 0)
          await new Promise((r) => setTimeout(r, 600))
          resolve(got)
        })
      })`,
    )
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ nftId: 'sage-nomad-009', available: 0 })
  })

  test('a conexão sobrevive a mais de 30 s (ping do servidor)', async ({ page }) => {
    test.setTimeout(60_000)
    await connectSocket(page)
    const alive = await page.evaluate<boolean>(
      `new Promise((resolve) => {
        const s = io({ transports: ['websocket'] })
        let dropped = false
        s.on('disconnect', () => { dropped = true })
        s.on('connect', () => setTimeout(() => resolve(!dropped && s.connected), 35000))
      })`,
    )
    expect(alive).toBe(true)
  })

  test('dropConnections derruba e o cliente reconecta depois', async ({ page }) => {
    test.setTimeout(30_000)
    await connectSocket(page)
    const r = await page.evaluate<{ disconnected: boolean; reconnected: boolean }>(
      `new Promise((resolve) => {
        const s = io({ transports: ['websocket'], reconnectionDelay: 300, reconnectionDelayMax: 600 })
        let disconnected = false, first = true
        s.on('connect', () => {
          if (first) { first = false; window.__kurioMock.dropConnections(1500); return }
          resolve({ disconnected, reconnected: true })
        })
        s.on('disconnect', () => { disconnected = true })
        setTimeout(() => resolve({ disconnected, reconnected: false }), 15000)
      })`,
    )
    expect(r).toEqual({ disconnected: true, reconnected: true })
  })

  test('sem oscilação aleatória em modo test', async ({ page }) => {
    await connectSocket(page)
    const events = await page.evaluate<number>(
      `new Promise((resolve) => {
        const s = io({ transports: ['websocket'] }); let n = 0
        s.on('nft:price_changed', () => n++); s.on('nft:stock_changed', () => n++)
        s.on('connect', () => {
          s.emit('nft:subscribe', { ids: ['emerald-ape-042', 'sage-nomad-009'] })
          setTimeout(() => resolve(n), 3000)
        })
      })`,
    )
    expect(events).toBe(0)
  })
})
