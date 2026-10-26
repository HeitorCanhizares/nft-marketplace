import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp } from './helpers.ts'

// Os handlers de favoritos e de "adicionar ao carrinho" do mock, por fetch dentro da página, sem nenhuma tela.
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

type CartLine = {
  id: string
  nft: { id: string } & Record<string, unknown>
  edition: { id: string; label: string }
  quantity: number
  unitPrice: string
  lineTotal: string
  availability: string
  available: number | null
}

type CartBody = ApiError & {
  id: string
  items: CartLine[]
  itemCount: number
  version: number
  ownerId?: string
}

type StoredCart = {
  id: string
  ownerId: string
  items: CartLine[]
  itemCount: number
  version: number
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

type CallOptions = { body?: unknown; raw?: string; token?: string; cartId?: string }

async function call<T = ApiError>(
  page: Page,
  method: Method,
  path: string,
  options: CallOptions = {},
): Promise<Result<T>> {
  const args = JSON.stringify({ method, path, ...options })
  return page.evaluate<Result<T>>(`(async () => {
    const a = ${args}
    const headers = {}
    let body
    if (a.raw !== undefined) body = a.raw
    else if (a.body !== undefined) body = JSON.stringify(a.body)
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (a.token) headers['Authorization'] = 'Bearer ' + a.token
    if (a.cartId) headers['X-Cart-Id'] = a.cartId
    try {
      const response = await fetch('/api' + a.path, { method: a.method, headers, body })
      const text = await response.text()
      return { status: response.status, body: text === '' ? null : JSON.parse(text) }
    } catch {
      return { status: 0, body: null, failed: true }
    }
  })()`)
}

const addItem = (page: Page, body: unknown, options: Omit<CallOptions, 'body'> = {}) =>
  call<CartBody>(page, 'POST', '/cart/items', { body, ...options })

const favorites = (page: Page, method: Method, nftId?: string, token?: string) =>
  call<{ ids: string[] } & ApiError>(
    page,
    method,
    nftId === undefined ? '/favorites' : `/favorites/${nftId}`,
    { token },
  )

const catalog = (page: Page, query: string, token?: string) =>
  call<{ items: { id: string }[]; total: number }>(page, 'GET', `/nfts?${query}`, { token })

async function login(page: Page, who: { email: string; password: string }, cartId?: string) {
  const result = await call<{ session: { token: string } }>(page, 'POST', '/auth/login', {
    body: who,
    cartId,
  })
  expect(result.status).toBe(200)
  return result.body.session.token
}

// Acesso direto ao banco do mock (só em modo test).
function stores<T>(page: Page, body: string): Promise<T> {
  return page.evaluate<T>(`(async () => {
    const s = window.__kurioMock.stores
    ${body}
  })()`)
}

type Target = { nftId: string; editionId: string; price: string }

// Escolhe uma edição do banco com a característica pedida e já a deixa com o estoque definido.
// `available: undefined` mantém o estoque do seed.
function pickEdition(
  page: Page,
  kind: 'limited' | 'open',
  available?: number,
  skip = 0,
): Promise<Target> {
  return stores<Target>(
    page,
    `
    const all = (await s.nftsStore.getAll()).sort((x, y) => x.id.localeCompare(y.id))
    const matches = all.filter((n) => n.editions.some((e) => ${
      kind === 'open' ? 'e.available === null' : 'e.available !== null && e.available >= 4'
    }))
    const nft = matches[${skip}]
    const edition = nft.editions.find((e) => ${
      kind === 'open' ? 'e.available === null' : 'e.available !== null && e.available >= 4'
    })
    ${
      available === undefined || kind === 'open'
        ? ''
        : `nft.editions = nft.editions.map((e) => e.id === edition.id ? { ...e, available: ${available} } : e)
    await s.nftsStore.put(nft)`
    }
    return { nftId: nft.id, editionId: edition.id, price: edition.price }
  `,
  )
}

const readCart = (page: Page, id: string) =>
  stores<StoredCart | undefined>(page, `return await s.cartsStore.get(${JSON.stringify(id)})`)

const multiplyEth = (page: Page, price: string, quantity: number) =>
  page.evaluate<string>(
    `window.__kurioMock.money.multiplyEth(${JSON.stringify(price)}, ${quantity})`,
  )

const isValidCart = (page: Page, body: unknown) =>
  page.evaluate<boolean>(
    `window.__kurio.schemas.cart.cartSchema.safeParse(${JSON.stringify(body)}).success`,
  )

const setScenarios = (page: Page, scenarios: string) =>
  page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`)

// Um NFT do catálogo que o usuário ainda não favoritou.
async function freeNftId(page: Page, token: string): Promise<string> {
  const mine = (await favorites(page, 'GET', undefined, token)).body.ids
  const all = await catalog(page, 'pageSize=300')
  const free = all.body.items.find((item) => !mine.includes(item.id))
  expect(free).toBeDefined()
  return free!.id
}

const GUEST = 'guest-cart-teste'

test.describe('favoritos', () => {
  test('sem token, GET, PUT e DELETE devolvem 401 UNAUTHORIZED', async ({ page }) => {
    await openApp(page)
    for (const method of ['GET', 'PUT', 'DELETE'] as const) {
      const result = await favorites(page, method, method === 'GET' ? undefined : 'emerald-ape-042')
      expect(result.status).toBe(401)
      expect(result.body.error.code).toBe('UNAUTHORIZED')
    }
  })

  test('session-expired: 401 SESSION_EXPIRED nas três rotas', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    await setScenarios(page, 'session-expired')
    for (const method of ['GET', 'PUT', 'DELETE'] as const) {
      const result = await favorites(
        page,
        method,
        method === 'GET' ? undefined : 'emerald-ape-042',
        token,
      )
      expect(result.status).toBe(401)
      expect(result.body.error.code).toBe('SESSION_EXPIRED')
    }
  })

  test('GET do usuário principal devolve os 12 ids do seed', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const result = await favorites(page, 'GET', undefined, token)
    expect(result.status).toBe(200)
    expect(result.body.ids).toHaveLength(12)
    expect(new Set(result.body.ids).size).toBe(12)

    const seeded = await stores<string[]>(
      page,
      `
      const user = (await s.usersStore.getAll()).find((u) => u.email === ${JSON.stringify(users.primary.email)})
      return (await s.favoritesStore.listByUserId(user.id)).map((f) => f.nftId)
    `,
    )
    expect([...result.body.ids].sort()).toEqual([...seeded].sort())
  })

  test('PUT é idempotente e DELETE também; o catálogo acompanha', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const current = (await favorites(page, 'GET', undefined, token)).body.ids
    const id = await freeNftId(page, token)
    expect(current).not.toContain(id)

    expect((await favorites(page, 'PUT', id, token)).status).toBe(204)
    expect((await favorites(page, 'PUT', id, token)).status).toBe(204)
    const added = (await favorites(page, 'GET', undefined, token)).body.ids
    expect(added.filter((item) => item === id)).toHaveLength(1)
    expect(added).toHaveLength(13)

    const inFavorites = await catalog(page, 'favorites=1&pageSize=300', token)
    expect(inFavorites.body.items.map((item) => item.id)).toContain(id)
    expect(inFavorites.body.total).toBe(13)

    expect((await favorites(page, 'DELETE', id, token)).status).toBe(204)
    expect((await favorites(page, 'DELETE', id, token)).status).toBe(204)
    const removed = (await favorites(page, 'GET', undefined, token)).body.ids
    expect(removed).toHaveLength(12)
    expect(removed).not.toContain(id)

    const afterRemoval = await catalog(page, 'favorites=1&pageSize=300', token)
    expect(afterRemoval.body.items.map((item) => item.id)).not.toContain(id)
  })

  test('PUT de NFT inexistente devolve 404 NOT_FOUND', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const result = await favorites(page, 'PUT', 'nao-existe-999', token)
    expect(result.status).toBe(404)
    expect(result.body.error.code).toBe('NOT_FOUND')
  })

  test('os favoritos de cada usuário são independentes', async ({ page }) => {
    await openApp(page)
    const primary = await login(page, users.primary)
    const other = await login(page, users.other)
    expect((await favorites(page, 'GET', undefined, other)).body.ids).toEqual([])

    const id = await freeNftId(page, primary)
    expect((await favorites(page, 'PUT', id, other)).status).toBe(204)
    expect((await favorites(page, 'GET', undefined, other)).body.ids).toEqual([id])
    expect((await favorites(page, 'GET', undefined, primary)).body.ids).not.toContain(id)

    // DELETE de quem não está favoritado também é 204 e não mexe nos favoritos do outro.
    expect((await favorites(page, 'DELETE', id, primary)).status).toBe(204)
    expect((await favorites(page, 'GET', undefined, other)).body.ids).toEqual([id])
  })
})

test.describe('POST /cart/items: visitante', () => {
  test('cria o carrinho com o X-Cart-Id e soma a quantidade ao repetir', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited')
    const input = { nftId: target.nftId, editionId: target.editionId, quantity: 1 }

    const first = await addItem(page, input, { cartId: GUEST })
    expect(first.status).toBe(200)
    expect(first.body.id).toBe(GUEST)
    expect(first.body.items).toHaveLength(1)
    expect(first.body.items[0]).toMatchObject({
      quantity: 1,
      unitPrice: target.price,
      lineTotal: target.price,
    })
    expect(first.body.items[0].nft.id).toBe(target.nftId)
    expect(first.body.items[0].edition.id).toBe(target.editionId)
    expect(first.body.itemCount).toBe(1)
    expect(first.body.version).toBe(1)
    expect(first.body).not.toHaveProperty('ownerId')
    expect(await isValidCart(page, first.body)).toBe(true)
    expect(first.body.items[0].nft).not.toHaveProperty('isFavorite')

    const second = await addItem(page, input, { cartId: GUEST })
    expect(second.status).toBe(200)
    expect(second.body.items).toHaveLength(1)
    expect(second.body.items[0].quantity).toBe(2)
    expect(second.body.items[0].lineTotal).toBe(await multiplyEth(page, target.price, 2))
    expect(second.body.itemCount).toBe(2)
    expect(second.body.version).toBe(2)
    expect(second.body.items[0].id).toBe(first.body.items[0].id)
    expect(await isValidCart(page, second.body)).toBe(true)
    expect(second.body.items[0].nft).not.toHaveProperty('isFavorite')

    const stored = await readCart(page, GUEST)
    expect(stored?.ownerId).toBe(GUEST)
    expect(stored?.items[0].quantity).toBe(2)
  })

  test('edições diferentes viram linhas diferentes', async ({ page }) => {
    await openApp(page)
    const limited = await pickEdition(page, 'limited')
    const open = await pickEdition(page, 'open')
    await addItem(page, { ...limited, quantity: 1 }, { cartId: GUEST })
    const result = await addItem(page, { ...open, quantity: 2 }, { cartId: GUEST })
    expect(result.body.items).toHaveLength(2)
    expect(result.body.itemCount).toBe(3)
    expect(result.body.version).toBe(2)
  })
})

test.describe('POST /cart/items: estoque', () => {
  test('estoque 1: a 2ª adição devolve 422 QUANTITY_EXCEEDS_STOCK e o carrinho não muda', async ({
    page,
  }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited', 1)
    const input = { nftId: target.nftId, editionId: target.editionId, quantity: 1 }

    const first = await addItem(page, input, { cartId: GUEST })
    expect(first.status).toBe(200)
    expect(first.body.items[0].availability).toBe('low_stock')
    expect(first.body.items[0].available).toBe(1)

    const second = await addItem(page, input, { cartId: GUEST })
    expect(second.status).toBe(422)
    expect(second.body.error.code).toBe('QUANTITY_EXCEEDS_STOCK')
    expect(second.body.error.details.available).toBe(1)

    const stored = await readCart(page, GUEST)
    expect(stored?.items).toHaveLength(1)
    expect(stored?.items[0].quantity).toBe(1)
    expect(stored?.version).toBe(1)
  })

  test('uma quantidade maior que o estoque de uma vez também devolve 422', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited', 5)
    const result = await addItem(page, { ...target, quantity: 6 }, { cartId: GUEST })
    expect(result.status).toBe(422)
    expect(result.body.error.code).toBe('QUANTITY_EXCEEDS_STOCK')
    expect(result.body.error.details.available).toBe(5)
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('edição com available 0 devolve 409 SOLD_OUT', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited', 0)
    const result = await addItem(page, { ...target, quantity: 1 }, { cartId: GUEST })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('SOLD_OUT')
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('edição ABERTA aceita quantidades grandes', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'open')
    const result = await addItem(page, { ...target, quantity: 500 }, { cartId: GUEST })
    expect(result.status).toBe(200)
    expect(result.body.items[0].quantity).toBe(500)
    expect(result.body.items[0].available).toBeNull()
    expect(result.body.items[0].availability).toBe('available')
  })

  test('availability low_stock com estoque até 3 e available acima disso', async ({ page }) => {
    await openApp(page)
    const low = await pickEdition(page, 'limited', 3)
    const lowResult = await addItem(page, { ...low, quantity: 1 }, { cartId: GUEST })
    expect(lowResult.body.items[0].availability).toBe('low_stock')

    const plenty = await pickEdition(page, 'limited', 4, 1)
    const plentyResult = await addItem(page, { ...plenty, quantity: 1 }, { cartId: GUEST })
    expect(plentyResult.body.items.at(-1)?.availability).toBe('available')
  })
})

test.describe('POST /cart/items: validação', () => {
  const invalidBodies: [string, (t: Target) => unknown, string][] = [
    ['quantity 0', (t) => ({ ...t, quantity: 0 }), 'quantity'],
    ['quantity 1.5', (t) => ({ ...t, quantity: 1.5 }), 'quantity'],
    ['quantity como texto', (t) => ({ ...t, quantity: '1' }), 'quantity'],
    ['quantity negativa', (t) => ({ ...t, quantity: -1 }), 'quantity'],
    ['sem quantity', (t) => ({ nftId: t.nftId, editionId: t.editionId }), 'quantity'],
    ['sem nftId', (t) => ({ editionId: t.editionId, quantity: 1 }), 'nftId'],
    ['sem editionId', (t) => ({ nftId: t.nftId, quantity: 1 }), 'editionId'],
  ]

  for (const [name, build, field] of invalidBodies) {
    test(`${name}: 422 com o campo ${field} e nada gravado`, async ({ page }) => {
      await openApp(page)
      const target = await pickEdition(page, 'limited')
      const result = await addItem(page, build(target), { cartId: GUEST })
      expect(result.status).toBe(422)
      expect(result.body.error.code).toBe('VALIDATION_ERROR')
      expect(Object.keys(result.body.error.fields ?? {})).toContain(field)
      expect(await readCart(page, GUEST)).toBeUndefined()
    })
  }

  test('corpo que não é objeto devolve 400 BAD_REQUEST', async ({ page }) => {
    await openApp(page)
    for (const raw of ['[]', 'null', '5', '"texto"', 'não é json']) {
      const result = await call<ApiError>(page, 'POST', '/cart/items', { raw, cartId: GUEST })
      expect(result.status, raw).toBe(400)
      expect(result.body.error.code).toBe('BAD_REQUEST')
    }
    const empty = await call<ApiError>(page, 'POST', '/cart/items', { cartId: GUEST })
    expect(empty.status).toBe(400)
  })

  test('NFT ou edição inexistente devolve 404 NOT_FOUND', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited')
    const other = await pickEdition(page, 'limited', undefined, 1)
    const cases = [
      { nftId: 'nao-existe-999', editionId: target.editionId, quantity: 1 },
      { nftId: target.nftId, editionId: 'nao-existe', quantity: 1 },
      // Edição que existe, mas de outro NFT.
      { nftId: target.nftId, editionId: other.editionId, quantity: 1 },
    ]
    for (const body of cases) {
      const result = await addItem(page, body, { cartId: GUEST })
      expect(result.status).toBe(404)
      expect(result.body.error.code).toBe('NOT_FOUND')
    }
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('sem Authorization e sem X-Cart-Id devolve 400 BAD_REQUEST', async ({ page }) => {
    await openApp(page)
    const target = await pickEdition(page, 'limited')
    const result = await addItem(page, { ...target, quantity: 1 })
    expect(result.status).toBe(400)
    expect(result.body.error.code).toBe('BAD_REQUEST')
  })
})

test.describe('POST /cart/items: usuário logado', () => {
  test('com token, a linha vai para o carrinho cart-user-teste', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const target = await pickEdition(page, 'limited')
    const before = (await readCart(page, 'cart-user-teste'))?.items ?? []
    const previous =
      before.find((line) => line.nft.id === target.nftId && line.edition.id === target.editionId)
        ?.quantity ?? 0

    const result = await addItem(page, { ...target, quantity: 1 }, { token })
    expect(result.status).toBe(200)
    expect(result.body.id).toBe('cart-user-teste')
    expect(result.body).not.toHaveProperty('ownerId')
    expect(await isValidCart(page, result.body)).toBe(true)

    const line = result.body.items.find((item) => item.edition.id === target.editionId)
    expect(line?.quantity).toBe(previous + 1)

    const stored = await readCart(page, 'cart-user-teste')
    expect(stored?.ownerId).toBe('user-teste')
    expect(stored?.items.find((item) => item.edition.id === target.editionId)?.quantity).toBe(
      previous + 1,
    )
  })

  test('com token, o X-Cart-Id é ignorado', async ({ page }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const target = await pickEdition(page, 'limited')
    const result = await addItem(page, { ...target, quantity: 1 }, { token, cartId: GUEST })
    expect(result.body.id).toBe('cart-user-teste')
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('token vencido devolve 401 SESSION_EXPIRED e token desconhecido, 401 UNAUTHORIZED', async ({
    page,
  }) => {
    await openApp(page)
    const token = await login(page, users.primary)
    const target = await pickEdition(page, 'limited')
    await stores<void>(
      page,
      `
      const session = await s.sessionsStore.get(${JSON.stringify(token)})
      await s.sessionsStore.put({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
    `,
    )
    const expired = await addItem(page, { ...target, quantity: 1 }, { token })
    expect(expired.status).toBe(401)
    expect(expired.body.error.code).toBe('SESSION_EXPIRED')

    const unknown = await addItem(page, { ...target, quantity: 1 }, { token: 'tok-invalido' })
    expect(unknown.status).toBe(401)
    expect(unknown.body.error.code).toBe('UNAUTHORIZED')
  })

  test('server-error:POST /cart/items devolve 500', async ({ page }) => {
    await openApp(page, 'server-error:POST /cart/items')
    const target = await pickEdition(page, 'limited')
    const result = await addItem(page, { ...target, quantity: 1 }, { cartId: GUEST })
    expect(result.status).toBe(500)
    expect(result.body.error.code).toBe('INTERNAL_ERROR')
    expect(await readCart(page, GUEST)).toBeUndefined()
  })
})

test.describe('POST /cart/items: mescla no login (05-005)', () => {
  test('o item do visitante vai para cart-user-teste e o carrinho do visitante some', async ({
    page,
  }) => {
    await openApp(page)
    const target = await pickEdition(page, 'open')
    const added = await addItem(page, { ...target, quantity: 2 }, { cartId: GUEST })
    expect(added.status).toBe(200)
    expect(await readCart(page, GUEST)).toBeDefined()

    const before = (await readCart(page, 'cart-user-teste'))?.items ?? []
    const previous =
      before.find((line) => line.nft.id === target.nftId && line.edition.id === target.editionId)
        ?.quantity ?? 0

    await login(page, users.primary, GUEST)

    const merged = await readCart(page, 'cart-user-teste')
    const line = merged?.items.find(
      (item) => item.nft.id === target.nftId && item.edition.id === target.editionId,
    )
    expect(line?.quantity).toBe(previous + 2)
    expect(await readCart(page, GUEST)).toBeUndefined()
  })
})
