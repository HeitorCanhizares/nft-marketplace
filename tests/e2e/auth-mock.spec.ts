import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, ready } from './helpers.ts'

// Os handlers de auth do mock, exercitados por fetch dentro da página, sem nenhuma tela.
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

type Session = { token: string; expiresAt: string }

type Adjustment = {
  nftId: string
  nftName: string
  editionId: string
  editionLabel: string
  requested: number
  applied: number
  reason: string
}

type AuthOk = {
  user: Record<string, unknown>
  session: Session
  details?: { adjustments: Adjustment[] }
}

type CartLine = {
  id: string
  nft: { id: string }
  edition: { id: string }
  quantity: number
  unitPrice: string
  lineTotal: string
  availability: string
  available: number | null
}

type StoredCart = {
  id: string
  ownerId: string
  items: CartLine[]
  itemCount: number
  version: number
  coupon?: { code: string }
}

type NftInfo = { id: string; name: string; editionId: string; editionLabel: string }

type CallOptions = { body?: unknown; token?: string; cartId?: string }

const SESSION_TTL_MS = 1800 * 1000

async function call<T = ApiError>(
  page: Page,
  method: 'GET' | 'POST',
  path: string,
  options: CallOptions = {},
): Promise<Result<T>> {
  const args = JSON.stringify({ method, path, ...options })
  return page.evaluate<Result<T>>(`(async () => {
    const a = ${args}
    const headers = {}
    if (a.body !== undefined) headers['Content-Type'] = 'application/json'
    if (a.token) headers['Authorization'] = 'Bearer ' + a.token
    if (a.cartId) headers['X-Cart-Id'] = a.cartId
    try {
      const response = await fetch('/api' + a.path, {
        method: a.method,
        headers,
        body: a.body === undefined ? undefined : JSON.stringify(a.body),
      })
      const text = await response.text()
      return { status: response.status, body: text === '' ? null : JSON.parse(text) }
    } catch {
      return { status: 0, body: null, failed: true }
    }
  })()`)
}

const availability = (page: Page, body: unknown) =>
  call<{ available: boolean } & ApiError>(page, 'POST', '/auth/availability', { body })

const register = (page: Page, body: unknown, options: Omit<CallOptions, 'body'> = {}) =>
  call<AuthOk & ApiError>(page, 'POST', '/auth/register', { body, ...options })

const login = (page: Page, body: unknown, options: Omit<CallOptions, 'body'> = {}) =>
  call<AuthOk & ApiError>(page, 'POST', '/auth/login', { body, ...options })

const getSession = (page: Page, token?: string) =>
  call<{ user: Record<string, unknown>; expiresAt: string } & ApiError>(
    page,
    'GET',
    '/auth/session',
    { token },
  )

const refresh = (page: Page, token?: string) =>
  call<{ session: Session } & ApiError>(page, 'POST', '/auth/refresh', { token })

const logout = (page: Page, token?: string) => call<null>(page, 'POST', '/auth/logout', { token })

const NEW_USER = {
  username: 'Novo_User',
  email: 'Novo.Usuario@Kurio.test',
  password: 'Zk7mQ4vRxLp9',
}

// Acesso direto ao banco do mock (só em modo test).
function stores<T>(page: Page, body: string): Promise<T> {
  return page.evaluate<T>(`(async () => {
    const s = window.__kurioMock.stores
    ${body}
  })()`)
}

// Define estoque e preço da primeira edição dos NFTs (ordenados por id) e devolve a identificação de cada um.
function setStock(
  page: Page,
  entries: { index: number; available: number | null; price: string }[],
): Promise<NftInfo[]> {
  return stores<NftInfo[]>(
    page,
    `
    const nfts = (await s.nftsStore.getAll()).sort((x, y) => x.id.localeCompare(y.id))
    const out = []
    for (const e of ${JSON.stringify(entries)}) {
      const nft = nfts[e.index]
      nft.editions = nft.editions.map((ed, i) => i === 0 ? { ...ed, available: e.available, price: e.price } : ed)
      await s.nftsStore.put(nft)
      out.push({ id: nft.id, name: nft.name, editionId: nft.editions[0].id, editionLabel: nft.editions[0].label })
    }
    return out
  `,
  )
}

type PlantLine = { index: number; quantity: number; itemId: string; unitPrice?: string }

// Planta um carrinho (de visitante ou de usuário) com itens da primeira edição dos NFTs.
function plantCart(
  page: Page,
  cart: { id: string; ownerId: string; lines: PlantLine[]; coupon?: string; version?: number },
): Promise<void> {
  return stores<void>(
    page,
    `
    const cart = ${JSON.stringify(cart)}
    const nfts = (await s.nftsStore.getAll()).sort((x, y) => x.id.localeCompare(y.id))
    const { multiplyEth } = window.__kurioMock.money
    const items = cart.lines.map((l) => {
      const nft = nfts[l.index]
      const ed = nft.editions[0]
      const unitPrice = l.unitPrice ?? ed.price
      return {
        id: l.itemId,
        nft: { id: nft.id, name: nft.name, tokenId: nft.tokenId, image: nft.image, price: nft.price, collection: nft.collection, network: nft.network },
        edition: { id: ed.id, label: ed.label },
        quantity: l.quantity,
        unitPrice,
        lineTotal: multiplyEth(unitPrice, l.quantity),
        availability: 'available',
        available: ed.available,
      }
    })
    await s.cartsStore.put({
      id: cart.id,
      ownerId: cart.ownerId,
      items,
      itemCount: items.reduce((t, i) => t + i.quantity, 0),
      version: cart.version ?? 0,
      ...(cart.coupon ? { coupon: { code: cart.coupon } } : {}),
    })
  `,
  )
}

function readCart(page: Page, id: string): Promise<StoredCart | undefined> {
  return stores<StoredCart | undefined>(
    page,
    `return await s.cartsStore.get(${JSON.stringify(id)})`,
  )
}

function summarize(cart: StoredCart | undefined) {
  return cart?.items.map((item) => ({
    nftId: item.nft.id,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }))
}

// Lê todas as stores do IndexedDB do mock, mais o localStorage e o sessionStorage, como um único texto.
function dumpStorage(page: Page): Promise<string> {
  return page.evaluate<string>(`(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('kurio-mock-db')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const parts = []
    for (const name of Array.from(db.objectStoreNames)) {
      const rows = await new Promise((resolve, reject) => {
        const req = db.transaction(name).objectStore(name).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      parts.push(JSON.stringify(rows))
    }
    db.close()
    parts.push(JSON.stringify({ ...localStorage }), JSON.stringify({ ...sessionStorage }))
    return parts.join('\\n')
  })()`)
}

test.describe('disponibilidade', () => {
  test('e-mail do seed, também em maiúsculas, está em uso', async ({ page }) => {
    await openApp(page)
    for (const email of [users.primary.email, 'TESTE@KURIO.TEST', '  Teste@Kurio.Test ']) {
      const result = await availability(page, { email })
      expect(result.status).toBe(200)
      expect(result.body).toEqual({ available: false })
    }
  })

  test('usuário do seed, também em maiúsculas, está em uso', async ({ page }) => {
    await openApp(page)
    for (const username of ['teste', 'TESTE']) {
      const result = await availability(page, { username })
      expect(result.status).toBe(200)
      expect(result.body).toEqual({ available: false })
    }
  })

  test('e-mail e usuário livres estão disponíveis', async ({ page }) => {
    await openApp(page)
    expect((await availability(page, { email: 'livre@kurio.test' })).body).toEqual({
      available: true,
    })
    expect((await availability(page, { username: 'usuario_livre' })).body).toEqual({
      available: true,
    })
  })

  test('formato inválido devolve 422 com fields', async ({ page }) => {
    await openApp(page)
    const badEmail = await availability(page, { email: 'x' })
    expect(badEmail.status).toBe(422)
    expect(badEmail.body.error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(badEmail.body.error.fields ?? {})).toContain('email')

    const empty = await availability(page, {})
    expect(empty.status).toBe(422)
    expect(empty.body.error.fields).toBeDefined()

    const both = await availability(page, { email: 'livre@kurio.test', username: 'livre' })
    expect(both.status).toBe(422)

    const badUsername = await availability(page, { username: 'açúcar' })
    expect(badUsername.status).toBe(422)
    expect(Object.keys(badUsername.body.error.fields ?? {})).toContain('username')
  })

  test('corpo que não é objeto devolve 400 BAD_REQUEST', async ({ page }) => {
    await openApp(page)
    for (const body of [[], 'texto', null, 5]) {
      const result = await availability(page, body)
      expect(result.status).toBe(400)
      expect(result.body.error.code).toBe('BAD_REQUEST')
    }
  })

  test('cenário server-error na rota devolve 500', async ({ page }) => {
    await openApp(page, 'server-error:POST /auth/availability')
    const result = await availability(page, { email: 'livre@kurio.test' })
    expect(result.status).toBe(500)
    expect(result.body.error.code).toBe('INTERNAL_ERROR')
  })

  test('os cenários email-taken e username-taken não alteram o resultado', async ({ page }) => {
    await openApp(page, 'email-taken,username-taken')
    expect((await availability(page, { email: 'livre@kurio.test' })).body).toEqual({
      available: true,
    })
    expect((await availability(page, { username: 'usuario_livre' })).body).toEqual({
      available: true,
    })
    expect((await availability(page, { email: users.primary.email })).body).toEqual({
      available: false,
    })
  })
})

test.describe('cadastro', () => {
  test('201 com usuário público e sessão de 30 minutos', async ({ page }) => {
    await openApp(page)
    const result = await register(page, NEW_USER)

    expect(result.status).toBe(201)
    expect(result.body.user).toMatchObject({
      username: 'Novo_User',
      email: 'novo.usuario@kurio.test',
      displayName: 'Novo_User',
    })
    expect(String(result.body.user.id)).toMatch(/^user-/)
    expect(Object.keys(result.body.user).sort()).toEqual(
      ['displayName', 'email', 'id', 'username'].sort(),
    )
    expect(result.body.session.token).toMatch(/^tok-/)
    const remaining = Date.parse(result.body.session.expiresAt) - Date.now()
    expect(Math.abs(remaining - SESSION_TTL_MS)).toBeLessThan(60_000)
    expect(result.body.details).toBeUndefined()
    expect(JSON.stringify(result.body)).not.toContain(NEW_USER.password)
  })

  test('o banco guarda hash e salt, nunca a senha', async ({ page }) => {
    await openApp(page)
    const result = await register(page, NEW_USER)
    const id = String(result.body.user.id)

    const record = await stores<Record<string, unknown>>(
      page,
      `return await s.usersStore.get(${JSON.stringify(id)})`,
    )
    expect(typeof record.passwordHash).toBe('string')
    expect(typeof record.passwordSalt).toBe('string')
    expect(String(record.passwordHash).length).toBeGreaterThan(20)
    expect(Object.values(record)).not.toContain(NEW_USER.password)
    expect(JSON.stringify(record)).not.toContain(NEW_USER.password)
  })

  test('a senha não aparece em nenhum lugar do armazenamento do navegador', async ({ page }) => {
    await openApp(page)
    await register(page, NEW_USER)
    await login(page, { email: NEW_USER.email, password: NEW_USER.password })
    await login(page, { email: NEW_USER.email, password: 'SenhaErrada1' })
    await getSession(page, (await loginToken(page, NEW_USER)).token)

    const dump = await dumpStorage(page)
    // Controle positivo: a leitura enxerga o que foi gravado, mas sem a senha.
    expect(dump).toContain('novo.usuario@kurio.test')
    expect(dump).toContain('passwordHash')
    expect(dump).not.toContain(NEW_USER.password)
  })

  test('o usuário criado consegue entrar', async ({ page }) => {
    await openApp(page)
    const created = await register(page, NEW_USER)
    const result = await login(page, { email: NEW_USER.email, password: NEW_USER.password })
    expect(result.status).toBe(200)
    expect(result.body.user.id).toBe(created.body.user.id)

    const wrong = await login(page, { email: NEW_USER.email, password: 'Outra1234' })
    expect(wrong.status).toBe(401)
  })

  test('e-mail repetido, com outras maiúsculas, devolve 409 EMAIL_TAKEN só com email', async ({
    page,
  }) => {
    await openApp(page)
    const result = await register(page, {
      username: 'livre_user',
      email: 'TESTE@kurio.test',
      password: 'Abcdefg1',
    })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('EMAIL_TAKEN')
    expect(result.body.error.fields).toEqual({ email: 'Este e-mail já está cadastrado.' })
  })

  test('usuário repetido, com outras maiúsculas, devolve 409 USERNAME_TAKEN só com username', async ({
    page,
  }) => {
    await openApp(page)
    const result = await register(page, {
      username: 'Teste',
      email: 'livre@kurio.test',
      password: 'Abcdefg1',
    })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('USERNAME_TAKEN')
    expect(result.body.error.fields).toEqual({ username: 'Este nome de usuário já está em uso.' })
  })

  test('e-mail e usuário repetidos devolvem as duas chaves em fields', async ({ page }) => {
    await openApp(page)
    const result = await register(page, {
      username: 'TESTE',
      email: 'Teste@Kurio.test',
      password: 'Abcdefg1',
    })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('EMAIL_TAKEN')
    expect(result.body.error.fields).toEqual({
      email: 'Este e-mail já está cadastrado.',
      username: 'Este nome de usuário já está em uso.',
    })
  })

  test('dois cadastros iguais em sequência: o segundo falha com 409', async ({ page }) => {
    await openApp(page)
    expect((await register(page, NEW_USER)).status).toBe(201)

    const second = await register(page, {
      ...NEW_USER,
      username: NEW_USER.username.toUpperCase(),
      email: NEW_USER.email.toUpperCase(),
    })
    expect(second.status).toBe(409)
    expect(Object.keys(second.body.error.fields ?? {}).sort()).toEqual(['email', 'username'])
  })

  test('cenário email-taken força o 409 com dados livres', async ({ page }) => {
    await openApp(page, 'email-taken')
    const result = await register(page, {
      username: 'livre_user',
      email: 'livre@kurio.test',
      password: 'Abcdefg1',
    })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('EMAIL_TAKEN')
    expect(result.body.error.fields).toEqual({ email: 'Este e-mail já está cadastrado.' })
  })

  test('cenário username-taken força o 409 com dados livres', async ({ page }) => {
    await openApp(page, 'username-taken')
    const result = await register(page, {
      username: 'livre_user',
      email: 'livre@kurio.test',
      password: 'Abcdefg1',
    })
    expect(result.status).toBe(409)
    expect(result.body.error.code).toBe('USERNAME_TAKEN')
    expect(result.body.error.fields).toEqual({ username: 'Este nome de usuário já está em uso.' })
  })

  test('senha sem número devolve 422 com fields.password', async ({ page }) => {
    await openApp(page)
    const result = await register(page, { ...NEW_USER, password: 'SenhaSemNumero' })
    expect(result.status).toBe(422)
    expect(result.body.error.code).toBe('VALIDATION_ERROR')
    expect(result.body.error.fields).toEqual({
      password: 'A senha deve ter pelo menos uma letra e um número.',
    })
  })

  test('usuário com acento devolve 422 com fields.username', async ({ page }) => {
    await openApp(page)
    const result = await register(page, { ...NEW_USER, username: 'açúcar' })
    expect(result.status).toBe(422)
    expect(Object.keys(result.body.error.fields ?? {})).toEqual(['username'])
  })

  test('e-mail inválido devolve 422 com fields.email', async ({ page }) => {
    await openApp(page)
    const result = await register(page, { ...NEW_USER, email: 'sem-arroba' })
    expect(result.status).toBe(422)
    expect(result.body.error.fields).toEqual({ email: 'Informe um e-mail válido.' })
  })

  test('corpo vazio devolve 422 com um erro por campo; corpo que não é objeto, 400', async ({
    page,
  }) => {
    await openApp(page)
    const empty = await register(page, {})
    expect(empty.status).toBe(422)
    expect(Object.keys(empty.body.error.fields ?? {}).sort()).toEqual([
      'email',
      'password',
      'username',
    ])

    const notObject = await register(page, [])
    expect(notObject.status).toBe(400)
    expect(notObject.body.error.code).toBe('BAD_REQUEST')
  })

  test('um registro inválido não cria usuário', async ({ page }) => {
    await openApp(page)
    await register(page, { ...NEW_USER, password: 'semnumero' })
    const count = await stores<number>(page, `return (await s.usersStore.getAll()).length`)
    const after = await register(page, NEW_USER)
    expect(after.status).toBe(201)
    expect(await stores<number>(page, `return (await s.usersStore.getAll()).length`)).toBe(
      count + 1,
    )
  })

  test('cenário validation-error na rota devolve 422', async ({ page }) => {
    await openApp(page, 'validation-error:POST /auth/register')
    const result = await register(page, NEW_USER)
    expect(result.status).toBe(422)
    expect(result.body.error.code).toBe('VALIDATION_ERROR')
    expect(result.body.error.fields).toEqual({ field: 'Valor inválido.' })
  })
})

async function loginToken(page: Page, credentials: { email: string; password: string }) {
  const result = await login(page, credentials)
  expect(result.status).toBe(200)
  return result.body.session
}

test.describe('login', () => {
  test('credenciais do seed devolvem 200 com usuário público e sessão', async ({ page }) => {
    await openApp(page)
    const result = await login(page, users.primary)

    expect(result.status).toBe(200)
    expect(result.body.user).toMatchObject({ id: 'user-teste', email: users.primary.email })
    expect(Object.keys(result.body.user)).not.toContain('passwordHash')
    expect(Object.keys(result.body.user)).not.toContain('passwordSalt')
    expect(JSON.stringify(result.body)).not.toContain(users.primary.password)
    expect(result.body.session.token).toMatch(/^tok-/)
    const remaining = Date.parse(result.body.session.expiresAt) - Date.now()
    expect(Math.abs(remaining - SESSION_TTL_MS)).toBeLessThan(60_000)
    expect(result.body.details).toBeUndefined()
  })

  test('e-mail em maiúsculas e com espaços também entra', async ({ page }) => {
    await openApp(page)
    const result = await login(page, {
      email: '  TESTE@Kurio.TEST ',
      password: users.primary.password,
    })
    expect(result.status).toBe(200)
    expect(result.body.user.id).toBe('user-teste')
  })

  test('senha errada e e-mail inexistente devolvem a mesma resposta 401', async ({ page }) => {
    await openApp(page)
    const wrongPassword = await login(page, {
      email: users.primary.email,
      password: 'SenhaErrada1',
    })
    const unknownEmail = await login(page, {
      email: 'fantasma@kurio.test',
      password: 'SenhaErrada1',
    })

    expect(wrongPassword.status).toBe(401)
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS')
    expect(wrongPassword.body.error.message).toBe('E-mail ou senha incorretos.')
    expect(wrongPassword.body.error.fields).toBeUndefined()
    expect(unknownEmail).toEqual(wrongPassword)
  })

  test('corpo inválido devolve 422 com fields; corpo que não é objeto, 400', async ({ page }) => {
    await openApp(page)
    const badEmail = await login(page, { email: 'x', password: 'qualquer' })
    expect(badEmail.status).toBe(422)
    expect(badEmail.body.error.fields).toEqual({ email: 'Informe um e-mail válido.' })

    const noPassword = await login(page, { email: users.primary.email, password: '' })
    expect(noPassword.status).toBe(422)
    expect(noPassword.body.error.fields).toEqual({ password: 'Informe sua senha.' })

    const empty = await login(page, {})
    expect(empty.status).toBe(422)
    expect(Object.keys(empty.body.error.fields ?? {}).sort()).toEqual(['email', 'password'])

    const notObject = await login(page, 'texto')
    expect(notObject.status).toBe(400)
    expect(notObject.body.error.code).toBe('BAD_REQUEST')
  })

  test('o login não aplica a regra de composição da senha', async ({ page }) => {
    await openApp(page)
    const result = await login(page, { email: users.primary.email, password: 'x' })
    expect(result.status).toBe(401)
  })

  test('4 falhas devolvem 401 e a 5ª já devolve 429 com retryAfterSeconds 30', async ({ page }) => {
    await openApp(page)
    const credentials = { email: users.primary.email, password: 'SenhaErrada1' }

    for (let attempt = 1; attempt <= 4; attempt++) {
      const result = await login(page, credentials)
      expect(result.status, `tentativa ${attempt}`).toBe(401)
      expect(result.body.error.code).toBe('INVALID_CREDENTIALS')
    }

    const fifth = await login(page, credentials)
    expect(fifth.status).toBe(429)
    expect(fifth.body.error.code).toBe('TOO_MANY_ATTEMPTS')
    expect(fifth.body.error.details.retryAfterSeconds).toBe(30)
    expect(fifth.body.error.message).toBe('Muitas tentativas. Tente novamente em 30 segundos.')
  })

  test('durante o bloqueio, a senha certa também recebe 429; depois de 31 s volta a entrar', async ({
    page,
  }) => {
    await page.clock.install()
    await openApp(page)
    const wrong = { email: users.primary.email, password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 5; attempt++) await login(page, wrong)

    const locked = await login(page, users.primary)
    expect(locked.status).toBe(429)
    expect(locked.body.error.code).toBe('TOO_MANY_ATTEMPTS')
    const remaining = Number(locked.body.error.details.retryAfterSeconds)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(30)

    await page.clock.fastForward(31_000)

    const after = await login(page, users.primary)
    expect(after.status).toBe(200)
    expect(after.body.user.id).toBe('user-teste')
  })

  test('o bloqueio expirado zera o contador', async ({ page }) => {
    await page.clock.install()
    await openApp(page)
    const wrong = { email: users.primary.email, password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 5; attempt++) await login(page, wrong)
    await page.clock.fastForward(31_000)

    for (let attempt = 1; attempt <= 4; attempt++) {
      expect((await login(page, wrong)).status, `tentativa ${attempt}`).toBe(401)
    }
    expect((await login(page, wrong)).status).toBe(429)
  })

  test('um login certo zera o contador de falhas', async ({ page }) => {
    await openApp(page)
    const wrong = { email: users.primary.email, password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 3; attempt++) await login(page, wrong)
    expect((await login(page, users.primary)).status).toBe(200)

    for (let attempt = 1; attempt <= 4; attempt++) {
      expect((await login(page, wrong)).status, `tentativa ${attempt}`).toBe(401)
    }
    expect((await login(page, wrong)).status).toBe(429)
  })

  test('o contador ignora maiúsculas e espaços do e-mail', async ({ page }) => {
    await openApp(page)
    const emails = [
      'teste@kurio.test',
      'TESTE@kurio.test',
      'Teste@Kurio.test',
      ' teste@kurio.test ',
    ]
    for (const email of emails) {
      expect((await login(page, { email, password: 'SenhaErrada1' })).status).toBe(401)
    }
    expect(
      (await login(page, { email: 'TESTE@KURIO.TEST', password: 'SenhaErrada1' })).status,
    ).toBe(429)
  })

  test('e-mail inexistente também bloqueia, sem revelar quais contas existem', async ({ page }) => {
    await openApp(page)
    const credentials = { email: 'fantasma@kurio.test', password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 4; attempt++) {
      expect((await login(page, credentials)).status).toBe(401)
    }
    const fifth = await login(page, credentials)
    expect(fifth.status).toBe(429)
    expect(fifth.body.error.details.retryAfterSeconds).toBe(30)
  })

  test('o bloqueio de um e-mail não afeta outro', async ({ page }) => {
    await openApp(page)
    for (let attempt = 1; attempt <= 5; attempt++) {
      await login(page, { email: users.primary.email, password: 'SenhaErrada1' })
    }
    expect((await login(page, users.other)).status).toBe(200)
  })

  test('o bloqueio vive só em memória: recarregar a página o zera', async ({ page }) => {
    await openApp(page)
    const wrong = { email: users.primary.email, password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 5; attempt++) await login(page, wrong)
    expect((await login(page, users.primary)).status).toBe(429)

    await page.reload()
    await ready(page)

    expect((await login(page, users.primary)).status).toBe(200)
    // O contador também recomeçou do zero: são precisas 5 falhas novas.
    for (let attempt = 1; attempt <= 4; attempt++) {
      expect((await login(page, wrong)).status, `tentativa ${attempt}`).toBe(401)
    }
  })

  test('o bloqueio não é gravado no IndexedDB', async ({ page }) => {
    await openApp(page)
    for (let attempt = 1; attempt <= 5; attempt++) {
      await login(page, { email: users.primary.email, password: 'SenhaErrada1' })
    }
    const dump = await dumpStorage(page)
    expect(dump).not.toContain('retryAfter')
    expect(dump).not.toContain('lockedUntil')
  })

  test('o login funciona com o cenário session-expired (a rota não é protegida)', async ({
    page,
  }) => {
    await openApp(page, 'session-expired')
    expect((await login(page, users.primary)).status).toBe(200)
  })
})

test.describe('sessão', () => {
  test('sem token devolve 401 UNAUTHORIZED', async ({ page }) => {
    await openApp(page)
    const result = await getSession(page)
    expect(result.status).toBe(401)
    expect(result.body.error.code).toBe('UNAUTHORIZED')
  })

  test('token inventado devolve 401 UNAUTHORIZED', async ({ page }) => {
    await openApp(page)
    const result = await getSession(page, 'tok-inventado')
    expect(result.status).toBe(401)
    expect(result.body.error.code).toBe('UNAUTHORIZED')
  })

  test('token do login devolve 200 com o usuário sem campos de senha e não estende a sessão', async ({
    page,
  }) => {
    await openApp(page)
    const session = await loginToken(page, users.primary)
    const result = await getSession(page, session.token)

    expect(result.status).toBe(200)
    expect(result.body.user).toMatchObject({ id: 'user-teste', email: users.primary.email })
    expect(Object.keys(result.body.user)).not.toContain('passwordHash')
    expect(Object.keys(result.body.user)).not.toContain('passwordSalt')
    expect(result.body.expiresAt).toBe(session.expiresAt)
  })

  test('sessão vencida devolve 401 SESSION_EXPIRED e o registro some', async ({ page }) => {
    await openApp(page)
    const session = await loginToken(page, users.primary)
    await stores<void>(
      page,
      `
      const record = await s.sessionsStore.get(${JSON.stringify(session.token)})
      await s.sessionsStore.put({ ...record, expiresAt: new Date(Date.now() - 1000).toISOString() })
    `,
    )

    const result = await getSession(page, session.token)
    expect(result.status).toBe(401)
    expect(result.body.error.code).toBe('SESSION_EXPIRED')
    expect(result.body.error.message).toBe('Sua sessão expirou. Entre novamente.')
    expect(
      await stores<boolean>(
        page,
        `return (await s.sessionsStore.get(${JSON.stringify(session.token)})) === undefined`,
      ),
    ).toBe(true)

    // Sem o registro, o mesmo token passa a ser desconhecido.
    expect((await getSession(page, session.token)).body.error.code).toBe('UNAUTHORIZED')
  })

  test('cenário session-expired: sessão, renovação e logout devolvem 401 SESSION_EXPIRED', async ({
    page,
  }) => {
    await openApp(page, 'session-expired')
    const session = await loginToken(page, users.primary)

    for (const result of [
      await getSession(page, session.token),
      await refresh(page, session.token),
      await call(page, 'POST', '/auth/logout', { token: session.token }),
    ]) {
      expect(result.status).toBe(401)
      expect((result.body as ApiError).error.code).toBe('SESSION_EXPIRED')
    }

    // O logout forçado não chega ao handler: a sessão continua gravada.
    expect(
      await stores<boolean>(
        page,
        `return (await s.sessionsStore.get(${JSON.stringify(session.token)})) !== undefined`,
      ),
    ).toBe(true)
  })

  test('refresh devolve token novo com TTL cheio e o antigo passa a dar 401', async ({ page }) => {
    await openApp(page)
    const old = await loginToken(page, users.primary)

    const result = await refresh(page, old.token)
    expect(result.status).toBe(200)
    expect(result.body.session.token).toMatch(/^tok-/)
    expect(result.body.session.token).not.toBe(old.token)
    expect(Date.parse(result.body.session.expiresAt)).toBeGreaterThanOrEqual(
      Date.parse(old.expiresAt),
    )
    expect(Object.keys(result.body)).toEqual(['session'])

    const oldAfter = await getSession(page, old.token)
    expect(oldAfter.status).toBe(401)
    expect(oldAfter.body.error.code).toBe('UNAUTHORIZED')

    const fresh = await getSession(page, result.body.session.token)
    expect(fresh.status).toBe(200)
    expect(fresh.body.expiresAt).toBe(result.body.session.expiresAt)
  })

  test('refresh sem token ou com token inventado devolve 401 UNAUTHORIZED', async ({ page }) => {
    await openApp(page)
    expect((await refresh(page)).body.error.code).toBe('UNAUTHORIZED')
    expect((await refresh(page, 'tok-inventado')).body.error.code).toBe('UNAUTHORIZED')
  })

  test('logout devolve 204, é idempotente e encerra a sessão', async ({ page }) => {
    await openApp(page)
    const session = await loginToken(page, users.primary)

    const first = await logout(page, session.token)
    expect(first.status).toBe(204)
    expect(first.body).toBeNull()

    const again = await logout(page, session.token)
    expect(again.status).toBe(204)

    const after = await getSession(page, session.token)
    expect(after.status).toBe(401)
    expect(after.body.error.code).toBe('UNAUTHORIZED')
  })

  test('logout sem token ou com token inventado também devolve 204', async ({ page }) => {
    await openApp(page)
    expect((await logout(page)).status).toBe(204)
    expect((await logout(page, 'tok-inventado')).status).toBe(204)
  })

  test('logout encerra só a sessão do token enviado', async ({ page }) => {
    await openApp(page)
    const first = await loginToken(page, users.primary)
    const second = await loginToken(page, users.primary)
    await logout(page, first.token)
    expect((await getSession(page, first.token)).status).toBe(401)
    expect((await getSession(page, second.token)).status).toBe(200)
  })
})

test.describe('mescla do carrinho no login e no cadastro', () => {
  const GUEST = 'guest-cart-1'
  const USER_CART = 'cart-user-teste'

  async function plantGuest(page: Page) {
    const [a, b] = await setStock(page, [
      { index: 0, available: 3, price: '1.19' },
      { index: 1, available: 10, price: '0.1' },
    ])
    await plantCart(page, {
      id: GUEST,
      ownerId: GUEST,
      lines: [
        { index: 0, quantity: 5, itemId: 'guest-a', unitPrice: '9.99' },
        { index: 1, quantity: 2, itemId: 'guest-b' },
      ],
    })
    return { a, b }
  }

  function adjustmentFor(info: NftInfo, requested: number, applied: number): Adjustment {
    return {
      nftId: info.id,
      nftName: info.name,
      editionId: info.editionId,
      editionLabel: info.editionLabel,
      requested,
      applied,
      reason: 'stock',
    }
  }

  test('login com X-Cart-Id ajusta ao estoque e devolve details.adjustments', async ({ page }) => {
    await openApp(page)
    const { a, b } = await plantGuest(page)

    const result = await login(page, users.primary, { cartId: GUEST })

    expect(result.status).toBe(200)
    expect(result.body.details).toEqual({ adjustments: [adjustmentFor(a, 5, 3)] })

    const cart = await readCart(page, USER_CART)
    expect(cart).toMatchObject({ id: USER_CART, ownerId: 'user-teste', itemCount: 5, version: 1 })
    // O preço vem do catálogo atual (não do valor velho do visitante) e o total é string exata.
    expect(summarize(cart)).toEqual([
      { nftId: a.id, quantity: 3, unitPrice: '1.19', lineTotal: '3.57' },
      { nftId: b.id, quantity: 2, unitPrice: '0.1', lineTotal: '0.20' },
    ])
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('cadastro com X-Cart-Id faz a mesma mescla', async ({ page }) => {
    await openApp(page)
    const { a, b } = await plantGuest(page)

    const result = await register(page, NEW_USER, { cartId: GUEST })

    expect(result.status).toBe(201)
    expect(result.body.details).toEqual({ adjustments: [adjustmentFor(a, 5, 3)] })

    const userId = String(result.body.user.id)
    const cart = await readCart(page, `cart-${userId}`)
    expect(cart).toMatchObject({ ownerId: userId, itemCount: 5, version: 1 })
    expect(summarize(cart)).toEqual([
      { nftId: a.id, quantity: 3, unitPrice: '1.19', lineTotal: '3.57' },
      { nftId: b.id, quantity: 2, unitPrice: '0.1', lineTotal: '0.20' },
    ])
    expect(await readCart(page, GUEST)).toBeUndefined()
  })

  test('mescla dentro do estoque não traz details, mas grava o carrinho', async ({ page }) => {
    await openApp(page)
    const [a] = await setStock(page, [{ index: 0, available: 10, price: '1.19' }])
    await plantCart(page, {
      id: GUEST,
      ownerId: GUEST,
      lines: [{ index: 0, quantity: 2, itemId: 'guest-a' }],
    })

    const result = await login(page, users.primary, { cartId: GUEST })

    expect(result.status).toBe(200)
    expect(result.body.details).toBeUndefined()
    expect(summarize(await readCart(page, USER_CART))).toEqual([
      { nftId: a.id, quantity: 2, unitPrice: '1.19', lineTotal: '2.38' },
    ])
  })

  test('o mesmo NFT e edição somam com o carrinho que o usuário já tinha', async ({ page }) => {
    await openApp(page)
    const [a, b] = await setStock(page, [
      { index: 0, available: 3, price: '1.19' },
      { index: 1, available: 10, price: '0.1' },
    ])
    await plantCart(page, {
      id: USER_CART,
      ownerId: 'user-teste',
      version: 7,
      lines: [
        { index: 0, quantity: 2, itemId: 'user-a' },
        { index: 1, quantity: 1, itemId: 'user-b' },
      ],
    })
    await plantCart(page, {
      id: GUEST,
      ownerId: GUEST,
      lines: [{ index: 0, quantity: 2, itemId: 'guest-a' }],
    })

    const result = await login(page, users.primary, { cartId: GUEST })

    expect(result.body.details).toEqual({ adjustments: [adjustmentFor(a, 4, 3)] })
    const cart = await readCart(page, USER_CART)
    expect(cart).toMatchObject({ itemCount: 4, version: 8 })
    // O item do usuário que o visitante não tocou fica como estava.
    expect(summarize(cart)).toEqual([
      { nftId: a.id, quantity: 3, unitPrice: '1.19', lineTotal: '3.57' },
      { nftId: b.id, quantity: 1, unitPrice: '0.1', lineTotal: '0.10' },
    ])
    expect(cart?.items[0].id).toBe('user-a')
  })

  test('o cupom do visitante só prevalece se o usuário não tinha', async ({ page }) => {
    await openApp(page)
    await setStock(page, [{ index: 0, available: 10, price: '1.19' }])
    await plantCart(page, {
      id: GUEST,
      ownerId: GUEST,
      coupon: 'VISITANTE',
      lines: [{ index: 0, quantity: 1, itemId: 'guest-a' }],
    })
    expect((await login(page, users.primary, { cartId: GUEST })).status).toBe(200)
    expect((await readCart(page, USER_CART))?.coupon).toEqual({ code: 'VISITANTE' })

    // Segundo usuário já tem cupom próprio: o do visitante é descartado.
    await plantCart(page, {
      id: 'cart-user-outro',
      ownerId: 'user-outro',
      coupon: 'DO-USUARIO',
      lines: [{ index: 0, quantity: 1, itemId: 'user-a' }],
    })
    await plantCart(page, {
      id: 'guest-cart-2',
      ownerId: 'guest-cart-2',
      coupon: 'VISITANTE-2',
      lines: [{ index: 0, quantity: 1, itemId: 'guest-a' }],
    })
    expect((await login(page, users.other, { cartId: 'guest-cart-2' })).status).toBe(200)
    expect((await readCart(page, 'cart-user-outro'))?.coupon).toEqual({ code: 'DO-USUARIO' })
  })

  test('sem X-Cart-Id não há details e o carrinho do visitante fica intacto', async ({ page }) => {
    await openApp(page)
    await plantGuest(page)

    const result = await login(page, users.primary)

    expect(result.status).toBe(200)
    expect('details' in result.body).toBe(false)
    expect(await readCart(page, USER_CART)).toBeUndefined()
    expect(await readCart(page, GUEST)).toBeDefined()
  })

  test('X-Cart-Id de um carrinho inexistente é ignorado', async ({ page }) => {
    await openApp(page)
    const result = await login(page, users.primary, { cartId: 'nao-existe' })
    expect(result.status).toBe(200)
    expect('details' in result.body).toBe(false)
    expect(await readCart(page, USER_CART)).toBeUndefined()
  })

  test('login com falha não mescla o carrinho', async ({ page }) => {
    await openApp(page)
    await plantGuest(page)
    const result = await login(
      page,
      { email: users.primary.email, password: 'SenhaErrada1' },
      { cartId: GUEST },
    )
    expect(result.status).toBe(401)
    expect(await readCart(page, GUEST)).toBeDefined()
    expect(await readCart(page, USER_CART)).toBeUndefined()
  })
})

test.describe('mescla do carrinho (lógica direta)', () => {
  function merge(page: Page, userId: string, guestId: string | null) {
    return page.evaluate<{
      cart: StoredCart | null
      adjustments: Adjustment[]
    }>(
      `window.__kurioMock.cartMerge.mergeGuestCart(${JSON.stringify(userId)}, ${JSON.stringify(guestId)})`,
    )
  }

  test('estoque 3 com 2 + 4 pedidos aplica 3 e registra requested 6', async ({ page }) => {
    await openApp(page)
    const [a] = await setStock(page, [{ index: 0, available: 3, price: '1.19' }])
    await plantCart(page, {
      id: 'cart-u1',
      ownerId: 'u1',
      lines: [{ index: 0, quantity: 2, itemId: 'u' }],
    })
    await plantCart(page, {
      id: 'g1',
      ownerId: 'g1',
      lines: [{ index: 0, quantity: 4, itemId: 'g' }],
    })

    const result = await merge(page, 'u1', 'g1')

    expect(result.adjustments).toEqual([
      {
        nftId: a.id,
        nftName: a.name,
        editionId: a.editionId,
        editionLabel: a.editionLabel,
        requested: 6,
        applied: 3,
        reason: 'stock',
      },
    ])
    expect(result.cart?.items).toHaveLength(1)
    expect(result.cart?.items[0]).toMatchObject({
      quantity: 3,
      available: 3,
      availability: 'available',
    })
  })

  test('estoque 0 remove o item e registra applied 0', async ({ page }) => {
    await openApp(page)
    const [a, b] = await setStock(page, [
      { index: 0, available: 0, price: '1.19' },
      { index: 1, available: 5, price: '0.1' },
    ])
    await plantCart(page, {
      id: 'cart-u1',
      ownerId: 'u1',
      lines: [
        { index: 0, quantity: 1, itemId: 'u-a' },
        { index: 1, quantity: 1, itemId: 'u-b' },
      ],
    })
    await plantCart(page, {
      id: 'g1',
      ownerId: 'g1',
      lines: [{ index: 0, quantity: 2, itemId: 'g' }],
    })

    const result = await merge(page, 'u1', 'g1')

    expect(result.adjustments).toHaveLength(1)
    expect(result.adjustments[0]).toMatchObject({ nftId: a.id, requested: 3, applied: 0 })
    expect(result.cart?.items.map((item) => item.nft.id)).toEqual([b.id])
    expect(result.cart?.itemCount).toBe(1)
  })

  test('item só do visitante acima do estoque também gera ajuste', async ({ page }) => {
    await openApp(page)
    const [a] = await setStock(page, [{ index: 0, available: 2, price: '1.19' }])
    await plantCart(page, {
      id: 'g1',
      ownerId: 'g1',
      lines: [{ index: 0, quantity: 9, itemId: 'g' }],
    })

    const result = await merge(page, 'u1', 'g1')

    expect(result.adjustments).toHaveLength(1)
    expect(result.adjustments[0]).toMatchObject({ nftId: a.id, requested: 9, applied: 2 })
    expect(result.cart).toMatchObject({ id: 'cart-u1', ownerId: 'u1', itemCount: 2, version: 1 })
    expect(result.cart?.items[0]).toMatchObject({ id: 'g', quantity: 2, lineTotal: '2.38' })
  })

  test('estoque ilimitado (null) aceita qualquer quantidade', async ({ page }) => {
    await openApp(page)
    await setStock(page, [{ index: 0, available: null, price: '0.1' }])
    await plantCart(page, {
      id: 'g1',
      ownerId: 'g1',
      lines: [{ index: 0, quantity: 30, itemId: 'g' }],
    })

    const result = await merge(page, 'u1', 'g1')

    expect(result.adjustments).toEqual([])
    expect(result.cart?.items[0]).toMatchObject({
      quantity: 30,
      lineTotal: '3.00',
      available: null,
    })
  })

  test('sem visitante, com visitante inexistente ou vazio, nada é escrito', async ({ page }) => {
    await openApp(page)
    await plantCart(page, { id: 'empty', ownerId: 'empty', lines: [] })

    expect(await merge(page, 'u1', null)).toEqual({ cart: null, adjustments: [] })
    expect(await merge(page, 'u1', 'nao-existe')).toEqual({ cart: null, adjustments: [] })
    expect(await merge(page, 'u1', 'empty')).toEqual({ cart: null, adjustments: [] })
    expect(await readCart(page, 'cart-u1')).toBeUndefined()
    // O carrinho vazio do visitante não é apagado.
    expect(await readCart(page, 'empty')).toBeDefined()
  })

  test('sem visitante devolve o carrinho atual do usuário sem alterá-lo', async ({ page }) => {
    await openApp(page)
    await setStock(page, [{ index: 0, available: 5, price: '1.19' }])
    await plantCart(page, {
      id: 'cart-u1',
      ownerId: 'u1',
      version: 3,
      lines: [{ index: 0, quantity: 1, itemId: 'u' }],
    })
    const before = await readCart(page, 'cart-u1')

    const result = await merge(page, 'u1', null)

    expect(result.cart).toEqual(before)
    expect(result.adjustments).toEqual([])
    expect(await readCart(page, 'cart-u1')).toEqual(before)
  })
})

test.describe('aritmética de ETH do mock', () => {
  function money(page: Page, expression: string) {
    return page.evaluate<unknown>(`(() => {
      const { ethToUnits, unitsToEth, multiplyEth } = window.__kurioMock.money
      return ${expression}
    })()`)
  }

  test('multiplyEth multiplica sem erro de ponto flutuante', async ({ page }) => {
    await openApp(page)
    expect(await money(page, `multiplyEth('1.19', 3)`)).toBe('3.57')
    expect(await money(page, `multiplyEth('0.1', 3)`)).toBe('0.30')
    expect(await money(page, `multiplyEth('26.846', 2)`)).toBe('53.692')
    expect(await money(page, `multiplyEth('1.19', 0)`)).toBe('0.00')
  })

  test('ethToUnits e unitsToEth são inversos exatos, com 2 casas no mínimo', async ({ page }) => {
    await openApp(page)
    expect(await money(page, `ethToUnits('1.19')`)).toBe(1190000)
    expect(await money(page, `ethToUnits('26.846')`)).toBe(26846000)
    expect(await money(page, `ethToUnits('0.1234569')`)).toBe(123456)
    expect(await money(page, `ethToUnits('2')`)).toBe(2000000)
    expect(await money(page, `unitsToEth(1190000)`)).toBe('1.19')
    expect(await money(page, `unitsToEth(2000000)`)).toBe('2.00')
    expect(await money(page, `unitsToEth(26846000)`)).toBe('26.846')
    expect(await money(page, `unitsToEth(1500000)`)).toBe('1.50')
    expect(await money(page, `unitsToEth(0)`)).toBe('0.00')
    expect(await money(page, `unitsToEth(1)`)).toBe('0.000001')
  })

  test('entradas inválidas lançam erro', async ({ page }) => {
    await openApp(page)
    const throws = async (expression: string) =>
      money(page, `(() => { try { ${expression}; return false } catch { return true } })()`)

    for (const value of ['1,19', '-1', '1e3', '', ' 1', '1.', '.5']) {
      expect(await throws(`ethToUnits(${JSON.stringify(value)})`), value).toBe(true)
    }
    expect(await throws(`unitsToEth(1.5)`)).toBe(true)
    expect(await throws(`unitsToEth(-1)`)).toBe(true)
    expect(await throws(`multiplyEth('1.19', -1)`)).toBe(true)
    expect(await throws(`multiplyEth('1.19', 1.5)`)).toBe(true)
  })
})

test.describe('falhas gerais e mensagens', () => {
  test('network-error na rota e o cenário offline fazem o fetch rejeitar', async ({ page }) => {
    await openApp(page, 'network-error:POST /auth/login')
    expect((await login(page, users.primary)).failed).toBe(true)
    // Só a rota marcada cai; as outras seguem normais.
    expect((await availability(page, { email: 'livre@kurio.test' })).status).toBe(200)

    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'offline')`)
    for (const result of [
      await login(page, users.primary),
      await availability(page, { email: 'livre@kurio.test' }),
      await register(page, NEW_USER),
      await getSession(page, 'tok-qualquer'),
    ]) {
      expect(result.failed).toBe(true)
    }
  })

  test('erros 500 e 503 forçados nas rotas de auth', async ({ page }) => {
    await openApp(page, 'server-error:POST /auth/login,unavailable:POST /auth/register')
    const loginResult = await login(page, users.primary)
    expect(loginResult.status).toBe(500)
    expect(loginResult.body.error.code).toBe('INTERNAL_ERROR')
    const registerResult = await register(page, NEW_USER)
    expect(registerResult.status).toBe(503)
    expect(registerResult.body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  test('toda mensagem de erro vem em português', async ({ page }) => {
    await openApp(page)
    const session = await loginToken(page, users.primary)
    await logout(page, session.token)

    const messages: [Result<ApiError>, string][] = [
      [
        await login(page, { email: users.primary.email, password: 'SenhaErrada1' }),
        'E-mail ou senha incorretos.',
      ],
      [await getSession(page), 'Entre na sua conta para continuar.'],
      [await getSession(page, session.token), 'Entre na sua conta para continuar.'],
      [await login(page, []), 'Requisição inválida.'],
      [await register(page, { ...NEW_USER, email: 'x' }), 'Revise os dados informados.'],
    ]
    for (const [result, expected] of messages) {
      expect(result.body.error.message).toBe(expected)
    }

    const wrong = { email: 'fantasma@kurio.test', password: 'SenhaErrada1' }
    for (let attempt = 1; attempt <= 4; attempt++) await login(page, wrong)
    const locked = await login(page, wrong)
    expect(locked.body.error.message).toBe('Muitas tentativas. Tente novamente em 30 segundos.')
  })
})
