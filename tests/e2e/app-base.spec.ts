import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  authState,
  bootWithHandlers,
  collectAnnouncements,
  OTHER_USER,
  openApp,
  ready,
  useHandler,
  USER,
} from './helpers.ts'

const FUTURE = '2099-01-01T00:00:00.000Z'

async function seedNftRecords(page: Page) {
  return page.evaluate<string>(
    `(async () => JSON.stringify(await window.__kurioMock.stores.nftsStore.getAll()))()`,
  )
}

test.describe('schemas', () => {
  test('validadores comuns', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<Record<string, boolean[]>>(`(() => {
      const c = window.__kurio.schemas.common
      const ok = (s, v) => s.safeParse(v).success
      return {
        username: [ok(c.usernameSchema, 'Heito_1.x'), ok(c.usernameSchema, 'ab'), ok(c.usernameSchema, 'a'.repeat(21)), ok(c.usernameSchema, 'com espaço'), ok(c.usernameSchema, 'açúcar')],
        email: [ok(c.emailSchema, 'a@b.co'), ok(c.emailSchema, 'sem-arroba')],
        password: [ok(c.passwordSchema, 'Senha1234'), ok(c.passwordSchema, 'semnumero'), ok(c.passwordSchema, '12345678'), ok(c.passwordSchema, 'curta1'), ok(c.passwordSchema, 'Açaí1234')],
        address: [ok(c.walletAddressSchema, '0x' + 'a'.repeat(40)), ok(c.walletAddressSchema, '0x' + 'a'.repeat(39)), ok(c.walletAddressSchema, 'a'.repeat(42))],
        eth: [ok(c.ethAmountSchema, '1.19'), ok(c.ethAmountSchema, '26.846'), ok(c.ethAmountSchema, 1.19), ok(c.ethAmountSchema, '1e3'), ok(c.ethAmountSchema, '-1')],
        int: [ok(c.positiveIntSchema, 1), ok(c.positiveIntSchema, 0), ok(c.positiveIntSchema, 1.5)],
      }
    })()`)
    expect(r).toEqual({
      username: [true, false, false, false, false],
      email: [true, false],
      password: [true, false, false, false, true],
      address: [true, false, false],
      eth: [true, true, false, false, false],
      int: [true, false, false],
    })
  })

  test('catálogo: o schema aceita todo o seed e rejeita preço numérico', async ({ page }) => {
    await openApp(page)
    const json = await seedNftRecords(page)
    const r = await page.evaluate<{
      total: number
      valid: number
      summary: number
      numericPrice: boolean
    }>(
      `(() => {
        const s = window.__kurio.schemas.nft
        const nfts = JSON.parse(${JSON.stringify(json)})
        return {
          total: nfts.length,
          valid: nfts.filter((n) => s.nftDetailSchema.safeParse(n).success).length,
          summary: nfts.filter((n) => s.nftSummarySchema.safeParse(n).success).length,
          numericPrice: s.nftSummarySchema.safeParse({ ...nfts[0], price: 1.19 }).success,
        }
      })()`,
    )
    expect(r).toEqual({ total: 283, valid: 283, summary: 283, numericPrice: false })
  })

  test('carrinho, pedido e conta', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<boolean[]>(`(() => {
      const { cart, order, user } = window.__kurio.schemas
      const item = { id: 'i1', nft: { id: 'x', name: 'X', tokenId: '#1', image: { src: '/a.webp', alt: 'a' }, price: '1.00', collection: { id: 'c', name: 'C' }, network: 'ethereum' },
        edition: { id: 'e', label: '1/10' }, quantity: 2, unitPrice: '1.00', lineTotal: '2.00', availability: 'available', available: 5 }
      const cartOk = { id: 'c1', items: [item], itemCount: 2, version: 1 }
      const wallet = { id: 'w', slot: 'primary', displayName: 'A', username: 'a_a', nickname: 'n', profileName: 'p', network: 'ethereum', address: '0x' + 'a'.repeat(40), provider: 'metamask', referralCode: '', email: 'a@b.co', ensName: '' }
      return [
        cart.cartSchema.safeParse(cartOk).success,
        cart.cartSchema.safeParse({ ...cartOk, items: [{ ...item, quantity: 1.5 }] }).success,
        cart.cartSchema.safeParse({ ...cartOk, items: [{ ...item, unitPrice: 1 }] }).success,
        order.orderStatusSchema.safeParse('confirmed').success,
        order.orderStatusSchema.safeParse('weird').success,
        user.walletSchema.safeParse(wallet).success,
        user.walletSchema.safeParse({ ...wallet, address: '0x1' }).success,
        user.walletsResponseSchema.safeParse({ primary: wallet, secondary: null }).success,
        user.walletsResponseSchema.safeParse({ primary: wallet }).success,
        cart.cartAdjustmentSchema.safeParse({ nftId: 'x', nftName: 'X', editionId: 'e', editionLabel: '1/50', requested: 5, applied: 3, reason: 'stock' }).success,
        cart.cartAdjustmentSchema.safeParse({ nftId: 'x', nftName: 'X', editionId: 'e', editionLabel: '1/50', requested: 5, applied: 0, reason: 'price' }).success,
      ]
    })()`)
    expect(r).toEqual([true, false, false, true, false, true, false, true, false, true, false])
  })
})

test.describe('ApiError e cliente HTTP', () => {
  test('erro do servidor vira ApiError com campos', async ({ page }) => {
    await openApp(page)
    await useHandler(
      page,
      `worker.use(http.get('/api/probe', () => HttpResponse.json({ error: { code: 'EMAIL_TAKEN', message: 'Este e-mail já está em uso.', fields: { email: 'Este e-mail já está em uso.' } } }, { status: 409 })))`,
    )
    const r = await page.evaluate<Record<string, unknown>>(
      `window.__kurio.http.get('/probe').then(() => null, (e) => ({ name: e.name, status: e.status, code: e.code, message: e.message, fields: e.fields, retry: window.__kurio.isRetryable(e) }))`,
    )
    expect(r).toEqual({
      name: 'ApiError',
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'Este e-mail já está em uso.',
      fields: { email: 'Este e-mail já está em uso.' },
      retry: false,
    })
  })

  test('falha de rede, timeout e cancelamento', async ({ page }) => {
    await openApp(page)
    await useHandler(
      page,
      `worker.use(
        http.get('/api/net', () => HttpResponse.error()),
        http.get('/api/slow', async () => { await new Promise((r) => setTimeout(r, 2000)); return HttpResponse.json({}) }),
      )`,
    )
    const r = await page.evaluate<Record<string, unknown>>(`(async () => {
      const k = window.__kurio
      const info = (e) => ({ code: e.code, status: e.status, retry: k.isRetryable(e) })
      const net = await k.http.get('/net').then(() => null, info)
      const original = k.http.defaults.timeout
      k.http.defaults.timeout = 300
      const timeout = await k.http.get('/slow').then(() => null, info)
      k.http.defaults.timeout = original
      const ctrl = new AbortController()
      const p = k.http.get('/slow', { signal: ctrl.signal }).then(() => null, info)
      ctrl.abort()
      return { net, timeout, canceled: await p, timeoutConst: k.HTTP_TIMEOUT_MS }
    })()`)
    expect(r).toEqual({
      net: { code: 'NETWORK_ERROR', status: 0, retry: true },
      timeout: { code: 'TIMEOUT', status: 0, retry: true },
      canceled: { code: 'CANCELED', status: 0, retry: false },
      timeoutConst: 10000,
    })
  })

  test('resposta fora do contrato vira INVALID_RESPONSE', async ({ page }) => {
    await openApp(page)
    await useHandler(
      page,
      `worker.use(http.get('/api/bad', () => HttpResponse.json({ price: 1.19 })))`,
    )
    const r = await page.evaluate<Record<string, unknown>>(`(async () => {
      const k = window.__kurio
      const z = k.schemas
      return k.http.get('/bad').then((res) => {
        try { return k.validate(z.common.ethAmountSchema, res.data.price) } catch (e) { return { code: e.code, hasIssues: Array.isArray(e.details?.issues) } }
      })
    })()`)
    expect(r).toEqual({ code: 'INVALID_RESPONSE', hasIssues: true })
  })

  test('cabeçalhos: Authorization com sessão e X-Cart-Id só com id guardado', async ({ page }) => {
    await openApp(page)
    await useHandler(
      page,
      `worker.use(http.get('/api/echo', ({ request }) => HttpResponse.json({ auth: request.headers.get('authorization'), cart: request.headers.get('x-cart-id') })))`,
    )
    const call = () =>
      page.evaluate<{ auth: string | null; cart: string | null }>(
        `window.__kurio.http.get('/echo').then((r) => r.data)`,
      )

    expect(await call()).toEqual({ auth: null, cart: null })
    expect(await page.evaluate(`localStorage.getItem('kurio:guest-cart-id')`)).toBeNull()

    await page.evaluate(`localStorage.setItem('kurio:guest-cart-id', 'guest-1')`)
    expect(await call()).toEqual({ auth: null, cart: 'guest-1' })

    await page.evaluate(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tok', expiresAt: '${FUTURE}' }))`,
    )
    expect(await call()).toEqual({ auth: 'Bearer tok', cart: null })
  })

  test('SESSION_EXPIRED avisa os assinantes uma vez e continua rejeitando', async ({ page }) => {
    await openApp(page)
    await useHandler(
      page,
      `worker.use(http.get('/api/expired', () => HttpResponse.json({ error: { code: 'SESSION_EXPIRED', message: 'Sua sessão expirou.' } }, { status: 401 })),
      http.get('/api/unauth', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 })))`,
    )
    const r = await page.evaluate<{ calls: number; code: string; calls2: number }>(`(async () => {
      const k = window.__kurio
      let calls = 0
      const off = k.onSessionExpired(() => { calls++ })
      const code = await k.http.get('/expired').then(() => 'ok', (e) => e.code)
      const after = calls
      await k.http.get('/unauth').catch(() => null)
      off()
      return { calls: after, code, calls2: calls }
    })()`)
    expect(r).toEqual({ calls: 1, code: 'SESSION_EXPIRED', calls2: 1 })
  })
})

test.describe('TanStack Query', () => {
  const run = (page: Page, route: string, kind: 'status500' | 'status404' | 'network') =>
    page.evaluate<number>(`(async () => {
      const k = window.__kurio
      const { worker, http, HttpResponse } = window.__kurioMock.msw
      let count = 0
      worker.use(http.get('/api/${route}', () => {
        count++
        return '${kind}' === 'network' ? HttpResponse.error()
          : HttpResponse.json({ error: { code: '${kind}' === 'status404' ? 'NOT_FOUND' : 'INTERNAL_ERROR', message: 'x' } }, { status: '${kind}' === 'status404' ? 404 : 500 })
      }))
      const d = k.queryClient.getDefaultOptions().queries
      await k.queryClient.fetchQuery({ queryKey: ['t', '${route}'], queryFn: () => k.http.get('/${route}'), retry: d.retry, retryDelay: d.retryDelay }).catch(() => null)
      return count
    })()`)

  test('GET: 500 e falha de rede repetem 2 vezes; 404 não repete', async ({ page }) => {
    test.setTimeout(30_000)
    await openApp(page)
    expect(await run(page, 'r500', 'status500')).toBe(3)
    expect(await run(page, 'r404', 'status404')).toBe(1)
    expect(await run(page, 'rnet', 'network')).toBe(3)
  })

  test('padrões do client e chaves', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<Record<string, unknown>>(`(() => {
      const k = window.__kurio
      const d = k.queryClient.getDefaultOptions()
      const q = k.queryKeys
      return {
        stale: d.queries.staleTime,
        mutationRetry: d.mutations.retry,
        keys: [q.nfts.list({ a: 1 }), q.nfts.detail('x'), q.nfts.related('x'), q.nfts.reviews('x', 2), q.orders.detail('o'), q.orders.pending, q.nfts.all, q.orders.all],
        simple: [q.home, q.favorites, q.cart, q.profile, q.wallets, q.session],
        roots: q.PRIVATE_QUERY_ROOTS,
      }
    })()`)
    expect(r).toMatchObject({
      stale: 30000,
      mutationRetry: false,
      keys: [
        ['nfts', 'list', { a: 1 }],
        ['nfts', 'detail', 'x'],
        ['nfts', 'related', 'x'],
        ['nfts', 'reviews', 'x', 2],
        ['orders', 'detail', 'o'],
        ['orders', 'pending'],
        ['nfts'],
        ['orders'],
      ],
    })
    const roots = (r as { roots: string[] }).roots
    expect([...roots].sort()).toEqual([
      'cart',
      'favorites',
      'orders',
      'profile',
      'quote',
      'session',
      'wallets',
    ])
  })
})

test.describe('anunciador', () => {
  test('mensagens polite e assertive chegam às regiões certas', async ({ page }) => {
    await openApp(page)
    await page.evaluate(`window.__kurio.announce('Item adicionado ao carrinho')`)
    await expect(page.getByRole('status')).toHaveText('Item adicionado ao carrinho')
    await page.evaluate(`window.__kurio.announce('Pagamento recusado', 'assertive')`)
    await expect(page.getByRole('alert')).toHaveText('Pagamento recusado')
  })

  test('a mesma mensagem duas vezes é relida e o foco não muda', async ({ page }) => {
    await openApp(page)
    await collectAnnouncements(page)
    await page.evaluate(
      `(() => { const i = document.createElement('input'); i.id = 'probe-input'; document.body.append(i); i.focus() })()`,
    )
    await page.evaluate(`window.__kurio.announce('Preço atualizado')`)
    await expect.poll(async () => (await announcements(page)).length).toBeGreaterThanOrEqual(1)
    await page.evaluate(`window.__kurio.announce('Preço atualizado')`)
    await expect
      .poll(async () => (await announcements(page)).filter((t) => t === 'Preço atualizado').length)
      .toBeGreaterThanOrEqual(2)
    expect(await page.evaluate(`document.activeElement?.id`)).toBe('probe-input')
  })
})

test.describe('socket', () => {
  test('envia o token no handshake, recebe eventos e refaz inscrições após queda', async ({
    page,
  }) => {
    test.setTimeout(40_000)
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tok-socket', expiresAt: '${FUTURE}' }))`,
    )
    await bootWithHandlers(
      page,
      `worker.use(
        http.get('/api/auth/session', () => HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${FUTURE}' })),
        m.msw.ws.link('*').addEventListener('connection', ({ client }) => {
          client.addEventListener('message', (e) => { (window.__sent ??= []).push(String(e.data)) })
        }),
      )`,
    )
    await page.goto('/')
    await ready(page)

    const edition = await page.evaluate<string>(
      `(async () => (await window.__kurioMock.stores.nftsStore.get('emerald-ape-042')).editions[0].id)()`,
    )
    const r = await page.evaluate<{ first: unknown[]; reconnected: boolean; second: unknown[] }>(
      `new Promise(async (resolve) => {
        const s = window.__kurio.socket
        const got = []
        s.onSocketEvent('nft:price_changed', (p) => got.push(p))
        let reconnected = false
        s.onReconnect(() => { reconnected = true })
        s.connectSocket()
        await new Promise((r) => setTimeout(r, 600))
        s.subscribeNfts(['emerald-ape-042'])
        await new Promise((r) => setTimeout(r, 300))
        await window.__kurioMock.triggerPriceChange('emerald-ape-042', '${edition}', '8.88')
        await new Promise((r) => setTimeout(r, 500))
        const first = [...got]
        window.__kurioMock.dropConnections(800)
        await new Promise((r) => setTimeout(r, 4500))
        await window.__kurioMock.triggerPriceChange('emerald-ape-042', '${edition}', '7.77')
        await new Promise((r) => setTimeout(r, 600))
        resolve({ first, reconnected, second: got.slice(first.length) })
      })`,
    )
    expect(r.first).toHaveLength(1)
    expect(r.first[0]).toMatchObject({ nftId: 'emerald-ape-042', price: '8.88' })
    expect(r.reconnected).toBe(true)
    expect(r.second).toHaveLength(1)
    expect(r.second[0]).toMatchObject({ price: '7.77' })
    const sent = await page.evaluate<string[]>(`window.__sent ?? []`)
    expect(sent.some((p) => p.startsWith('40') && p.includes('tok-socket'))).toBe(true)
  })
})

test.describe('carteira', () => {
  test('o simulador está registrado e o hook segue conexão e desconexão', async ({ page }) => {
    const problems: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text())
    })
    await openApp(page)
    await collectAnnouncements(page)
    expect(await page.evaluate(`window.__kurio.walletRegistry.hasWalletProvider()`)).toBe(true)

    await page.evaluate(`window.__kurio.wallet.connect('metamask', 'ethereum')`)
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('connected')
    const state = await page.evaluate<{ address: string; network: string }>(
      `window.__kurio.wallet.state`,
    )
    expect(state.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(state.network).toBe('ethereum')

    await page.evaluate(`window.__kurio.wallet.disconnect()`)
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('disconnected')
    const texts = await announcements(page)
    expect(texts.some((t) => t.startsWith('Conectando à MetaMask'))).toBe(true)
    expect(texts.some((t) => t.startsWith('Conectada: 0x') && t.includes('…'))).toBe(true)
    await expect.poll(async () => announcements(page)).toContain('Carteira desconectada')
    expect(problems.filter((t) => /flushSync|lifecycle|Warning/i.test(t))).toEqual([])
  })

  test('conexão recusada na carteira', async ({ page }) => {
    await openApp(page, 'wallet-rejected')
    await collectAnnouncements(page)
    await page.evaluate(`window.__kurio.wallet.connect('metamask', 'ethereum')`)
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('rejected')
    expect(await announcements(page)).toContain('Conexão recusada na carteira')
  })

  test('shortAddress e isHexAddress', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<unknown[]>(`(() => {
      const a = window.__kurio.address
      return [a.shortAddress('0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C'), a.isHexAddress('0x' + 'a'.repeat(40)), a.isHexAddress('0x123')]
    })()`)
    expect(r).toEqual(['0xA91F…E82C', true, false])
  })
})

test.describe('sessão (lib)', () => {
  test('leitura, expiração e carrinho do visitante', async ({ page }) => {
    await openApp(page)
    const r = await page.evaluate<Record<string, unknown>>(`(() => {
      const s = window.__kurio.session
      const now = Date.parse('2026-10-25T12:00:00Z')
      const out = {}
      localStorage.setItem('kurio:session', '{nao-json')
      out.invalidJson = s.readSession()
      localStorage.setItem('kurio:session', JSON.stringify({ token: 1 }))
      out.invalidShape = s.readSession()
      s.writeSession({ token: 't', expiresAt: '2026-10-25T12:10:00.000Z' })
      out.valid = s.readSession()
      out.until = s.msUntilExpiry('2026-10-25T12:10:00Z', now)
      out.warning = s.msUntilWarning('2026-10-25T12:10:00Z', now)
      out.warningShort = s.msUntilWarning('2026-10-25T12:01:00Z', now)
      out.negative = s.msUntilExpiry('2026-10-25T11:00:00Z', now)
      out.expired = [s.isExpired('2026-10-25T11:59:59Z', now), s.isExpired('2026-10-25T12:00:01Z', now)]
      s.clearSession()
      out.cleared = s.readSession()
      out.guestBefore = s.getGuestCartId()
      const id = s.ensureGuestCartId()
      out.guestSame = id === s.ensureGuestCartId() && id === s.getGuestCartId()
      s.clearGuestCartId()
      out.guestAfter = s.getGuestCartId()
      out.warningMs = s.EXPIRY_WARNING_MS
      return out
    })()`)
    expect(r).toEqual({
      invalidJson: null,
      invalidShape: null,
      valid: { token: 't', expiresAt: '2026-10-25T12:10:00.000Z' },
      until: 600000,
      warning: 480000,
      warningShort: 0,
      negative: 0,
      expired: [true, false],
      cleared: null,
      guestBefore: null,
      guestSame: true,
      guestAfter: null,
      warningMs: 120000,
    })
  })
})

test.describe('AuthContext', () => {
  const sessionHandler = (status: 'ok' | '401' | 'net') =>
    status === 'ok'
      ? `worker.use(http.get('/api/auth/session', () => HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${FUTURE}' })))`
      : status === '401'
        ? `worker.use(http.get('/api/auth/session', () => HttpResponse.json({ error: { code: 'SESSION_EXPIRED', message: 'x' } }, { status: 401 })))`
        : `worker.use(http.get('/api/auth/session', () => HttpResponse.error()))`

  test('sem token: visitante, sem chamar a API de sessão', async ({ page }) => {
    const calls: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/auth/session')) calls.push(r.url())
    })
    await openApp(page)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(calls).toEqual([])
  })

  test('token válido: sessão recuperada e mantida após reload', async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 't1', expiresAt: '${FUTURE}' }))`,
    )
    await bootWithHandlers(page, sessionHandler('ok'))
    await page.goto('/')
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    expect((await authState(page)).user?.email).toBe(USER.email)
    await page.reload()
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  })

  test('token recusado (401): limpa a sessão e segue como visitante', async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'old', expiresAt: '${FUTURE}' }))`,
    )
    await bootWithHandlers(page, sessionHandler('401'))
    await page.goto('/')
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await page.evaluate(`localStorage.getItem('kurio:session')`)).toBeNull()
  })

  test('erro de rede na inicialização mantém o token', async ({ page }) => {
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'keep', expiresAt: '${FUTURE}' }))`,
    )
    await bootWithHandlers(page, sessionHandler('net'))
    await page.goto('/')
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await page.evaluate(`localStorage.getItem('kurio:session')`)).toContain('keep')
  })

  test('aviso 2 min antes e expiração, com relógio controlado', async ({ page }) => {
    const start = new Date('2026-10-25T12:00:00Z')
    await page.clock.install({ time: start })
    const expiresAt = '2026-10-25T12:05:00.000Z'
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tk', expiresAt: '${expiresAt}' }))`,
    )
    await bootWithHandlers(
      page,
      `worker.use(http.get('/api/auth/session', () => HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${expiresAt}' })))`,
    )
    await page.goto('/')
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await collectAnnouncements(page)
    expect((await authState(page)).expiryWarning).toBe(false)

    await page.clock.fastForward('03:01')
    await expect.poll(async () => (await authState(page)).expiryWarning).toBe(true)
    expect((await authState(page)).status).toBe('authenticated')

    await page.clock.fastForward('02:01')
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await page.evaluate(`localStorage.getItem('kurio:session')`)).toBeNull()
    // O anunciador escreve no quadro seguinte (rAF), que também usa o relógio falso
    await page.clock.fastForward(100)
    await expect.poll(async () => announcements(page)).toContain('Sua sessão expirou.')
  })

  test('signIn, refresh e signOut', async ({ page }) => {
    await bootWithHandlers(
      page,
      `worker.use(
        http.post('/api/auth/login', () => HttpResponse.json({ user: ${JSON.stringify(USER)}, session: { token: 'tk-login', expiresAt: '${FUTURE}' } })),
        http.post('/api/auth/refresh', () => HttpResponse.json({ session: { token: 'tk-new', expiresAt: '${FUTURE}' } })),
        http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
      )`,
    )
    await page.goto('/')
    await ready(page)
    await collectAnnouncements(page)

    await page.evaluate(`window.__kurio.auth.signIn({ email: '${USER.email}', password: 'x' })`)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    expect(await page.evaluate(`localStorage.getItem('kurio:session')`)).toContain('tk-login')

    await page.evaluate(`window.__kurio.auth.refreshSession()`)
    await expect
      .poll(() => page.evaluate(`localStorage.getItem('kurio:session')`))
      .toContain('tk-new')

    await page.evaluate(`window.__kurio.auth.signOut()`)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await page.evaluate(`localStorage.getItem('kurio:session')`)).toBeNull()
    expect(await announcements(page)).toContain('Você saiu da sua conta')
  })

  test('troca de usuário limpa os dados privados; o mesmo usuário não', async ({ page }) => {
    await bootWithHandlers(
      page,
      `let n = 0
       worker.use(http.post('/api/auth/login', async ({ request }) => {
         const { email } = await request.json()
         const u = email === '${OTHER_USER.email}' ? ${JSON.stringify(OTHER_USER)} : ${JSON.stringify(USER)}
         return HttpResponse.json({ user: u, session: { token: 'tk-' + (++n), expiresAt: '${FUTURE}' } })
       }))`,
    )
    await page.goto('/')
    await ready(page)
    const hasFavorites = () =>
      page.evaluate<boolean>(`window.__kurio.queryClient.getQueryData(['favorites']) !== undefined`)
    const seed = () =>
      page.evaluate(`window.__kurio.queryClient.setQueryData(['favorites'], { ids: ['a'] })`)

    await page.evaluate(`window.__kurio.auth.signIn({ email: '${USER.email}', password: 'x' })`)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await seed()
    await page.evaluate(`window.__kurio.auth.signIn({ email: '${USER.email}', password: 'x' })`)
    await expect
      .poll(() => page.evaluate(`localStorage.getItem('kurio:session')`))
      .toContain('tk-2')
    expect(await hasFavorites()).toBe(true)

    await page.evaluate(
      `window.__kurio.auth.signIn({ email: '${OTHER_USER.email}', password: 'x' })`,
    )
    await expect
      .poll(() => page.evaluate(`localStorage.getItem('kurio:session')`))
      .toContain('tk-3')
    expect(await hasFavorites()).toBe(false)
  })
})

test.describe('clearPrivateSession', () => {
  test('executa as cinco etapas e é idempotente', async ({ page }) => {
    await openApp(page)
    await page.evaluate(`window.__kurio.wallet.connect('metamask', 'ethereum')`)
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('connected')
    await page.evaluate(`(() => {
      const k = window.__kurio
      for (const key of ['favorites', 'cart', 'quote', 'orders', 'profile', 'wallets', 'session']) k.queryClient.setQueryData([key], { x: 1 })
      k.queryClient.setQueryData(['nfts', 'list', {}], { items: [] })
      k.queryClient.setQueryData(['home'], { ok: true })
      sessionStorage.setItem('kurio:checkout', '{}')
      sessionStorage.setItem('kurio:checkout-draft', '{}')
      localStorage.setItem('kurio:guest-cart-id', 'guest-x')
      k.socket.subscribeNfts(['emerald-ape-042'])
    })()`)

    await page.evaluate(`window.__kurio.clearPrivateSession()`)
    const r = await page.evaluate<Record<string, unknown>>(`(() => {
      const k = window.__kurio
      const has = (key) => k.queryClient.getQueryData(key) !== undefined
      return {
        privateLeft: ['favorites', 'cart', 'quote', 'orders', 'profile', 'wallets', 'session'].filter((x) => has([x])),
        nfts: has(['nfts', 'list', {}]),
        home: has(['home']),
        checkout: sessionStorage.getItem('kurio:checkout'),
        draft: sessionStorage.getItem('kurio:checkout-draft'),
        guest: localStorage.getItem('kurio:guest-cart-id'),
      }
    })()`)
    expect(r).toEqual({
      privateLeft: [],
      nfts: false,
      home: true,
      checkout: null,
      draft: null,
      guest: null,
    })
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('disconnected')

    await page.evaluate(`window.__kurio.clearPrivateSession()`)
    expect(await page.evaluate(`window.__kurio.wallet.state.status`)).toBe('disconnected')
  })
})
