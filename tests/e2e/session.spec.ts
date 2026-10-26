import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { announcements, authState, collectAnnouncements, ready } from './helpers.ts'

const EXPIRED_TOAST = 'Sua sessão expirou. Entre novamente para continuar.'
const WARNING_ANNOUNCEMENT =
  'Sua sessão expira em 2 minutos. Use "Continuar conectado" para renovar.'
const SESSION_MS = 1800 * 1000

type Credentials = { email: string; password: string }

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function go(page: Page, path = '/', scenarios?: string) {
  if (scenarios !== undefined) {
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`,
    )
  }
  await page.goto(path)
  await ready(page)
}

function scope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

async function setScenarios(page: Page, value: string) {
  await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(value)})`)
}

async function signInBridge(page: Page, credentials: Credentials = users.primary) {
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(credentials)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function signInForm(
  page: Page,
  testInfo: TestInfo,
  credentials: Credentials = users.primary,
) {
  const form = scope(page, testInfo)
  await form.getByLabel('E-mail').fill(credentials.email)
  await form.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function navigate(page: Page, path: string) {
  await page.evaluate(`window.__kurio.router.navigate({ to: ${JSON.stringify(path)} })`)
  await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : `${path}$`}`))
}

function storageValue(page: Page, kind: 'localStorage' | 'sessionStorage', key: string) {
  return page.evaluate<string | null>(`${kind}.getItem(${JSON.stringify(key)})`)
}

async function storedSession(page: Page) {
  const raw = await storageValue(page, 'localStorage', 'kurio:session')
  return raw === null ? null : (JSON.parse(raw) as { token: string; expiresAt: string })
}

function requestsTo(page: Page, path: string) {
  const seen: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith(path)) seen.push(request.url())
  })
  return seen
}

function mockStores<T>(page: Page, body: string): Promise<T> {
  return page.evaluate<T>(`(async () => {
    const s = window.__kurioMock.stores
    ${body}
  })()`)
}

// Cabeçalho do desktop; no mobile ele existe no DOM, mas fica oculto.
// Com o modal de login aberto, o cabeçalho fica inerte (fora da árvore de acessibilidade): daí includeHidden.
const headerEntrar = (page: Page) =>
  page
    .getByRole('banner', { includeHidden: true })
    .getByRole('link', { name: 'Entrar', includeHidden: true })

test.describe('1. Sessão recuperada', () => {
  test('recarregar mantém a sessão, sem piscar "Entrar" durante a recuperação', async ({
    page,
  }) => {
    await go(page)
    await signInBridge(page)
    expect((await storedSession(page))?.token).toBeTruthy()

    // Vigia o DOM desde o primeiro quadro: se o link "Entrar" do cabeçalho aparecer em algum
    // momento da recuperação, a flag sobe. (Seletor CSS: observação dentro da página, sem papel
    // acessível equivalente para "existiu em algum instante".)
    await page.addInitScript(`(() => {
      window.__sawEntrar = false
      const check = () => {
        if (document.querySelector('header a[href^="/entrar"]')) window.__sawEntrar = true
      }
      new MutationObserver(check).observe(document, { childList: true, subtree: true })
    })()`)

    await page.reload()
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    expect((await authState(page)).user?.email).toBe(users.primary.email)
    expect(await page.evaluate<boolean>('window.__sawEntrar')).toBe(false)

    // Controle: o mesmo vigia dispara quando de fato não há sessão.
    await page.evaluate(`localStorage.removeItem('kurio:session')`)
    await page.reload()
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await page.evaluate<boolean>('window.__sawEntrar')).toBe(true)
  })

  for (const [label, session] of [
    [
      'inexistente no servidor',
      { token: 'token-que-nao-existe', expiresAt: '2099-01-01T00:00:00.000Z' },
    ],
    ['vencido', { token: 'token-vencido', expiresAt: '2000-01-01T00:00:00.000Z' }],
  ] as const) {
    test(`token ${label}: sessão anônima e o item sai do localStorage`, async ({ page }) => {
      await page.addInitScript(
        `localStorage.setItem('kurio:session', ${JSON.stringify(JSON.stringify(session))})`,
      )
      await go(page)
      await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
      expect(await storageValue(page, 'localStorage', 'kurio:session')).toBeNull()
    })
  }

  test('erro de rede em GET /auth/session: anônimo, mas o token é mantido', async ({ page }) => {
    await go(page)
    await signInBridge(page)
    const before = await storedSession(page)

    await setScenarios(page, 'network-error:GET /auth/session')
    await page.reload()
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    expect(await storedSession(page)).toEqual(before)
  })
})

test.describe('2. Aviso 2 minutos antes de expirar', () => {
  test('aparece só nos últimos 120 s, anuncia uma vez e não tira o foco de quem digita', async ({
    page,
  }) => {
    await page.clock.install()
    await go(page)
    await signInBridge(page)
    await collectAnnouncements(page)

    // Um campo em edição. As páginas logadas ainda não têm formulário editável (a newsletter é
    // somente leitura), então o teste injeta um campo avulso no corpo da página.
    await page.evaluate(`document.body.insertAdjacentHTML('beforeend',
      '<label>Campo de teste <input type="text"></label>')`)
    const field = page.getByLabel('Campo de teste')
    await field.focus()
    await field.pressSequentially('digitando')

    await page.clock.fastForward(SESSION_MS - 130_000)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    expect((await authState(page)).expiryWarning).toBe(false)

    await page.clock.fastForward(15_000)
    const banner = page.getByRole('alertdialog', { name: 'Sua sessão expira em breve' })
    await expect(banner).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Continuar conectado' })).toBeVisible()

    // O anunciador escreve no quadro seguinte, que também usa o relógio falso.
    await page.clock.fastForward(100)
    await expect.poll(async () => announcements(page)).toContain(WARNING_ANNOUNCEMENT)
    await page.clock.fastForward(5_000)
    expect(
      (await announcements(page)).filter((text) => text === WARNING_ANNOUNCEMENT),
    ).toHaveLength(1)

    await expect(field).toBeFocused()
    await expect(field).toHaveValue('digitando')
  })
})

test.describe('3. Continuar conectado', () => {
  async function openWarning(page: Page) {
    await page.clock.install()
    await go(page)
    await signInBridge(page)
    await page.clock.fastForward(SESSION_MS - 100_000)
    const banner = page.getByRole('alertdialog', { name: 'Sua sessão expira em breve' })
    await expect(banner).toBeVisible()
    return banner
  }

  test('renova: novo token e expiresAt, aviso some, toast e foco no conteúdo principal', async ({
    page,
  }) => {
    const refreshes = requestsTo(page, '/api/auth/refresh')
    const banner = await openWarning(page)
    const before = await storedSession(page)

    await banner.getByRole('button', { name: 'Continuar conectado' }).click()

    await expect(banner).toHaveCount(0)
    expect(refreshes).toHaveLength(1)
    const after = await storedSession(page)
    expect(after?.token).not.toBe(before?.token)
    expect(Date.parse(after?.expiresAt ?? '')).toBeGreaterThan(Date.parse(before?.expiresAt ?? ''))
    await expect(page.getByText('Sessão renovada.')).toBeVisible()
    await expect(page.getByRole('main')).toBeFocused()
    expect((await authState(page)).expiryWarning).toBe(false)
  })

  test('falha de rede: o aviso fica com a mensagem e permite tentar de novo', async ({ page }) => {
    const banner = await openWarning(page)

    await setScenarios(page, 'network-error:POST /auth/refresh')
    await banner.getByRole('button', { name: 'Continuar conectado' }).click()
    await expect(banner.getByText('Não foi possível renovar agora. Tente novamente.')).toBeVisible()
    await expect(banner).toBeVisible()

    await setScenarios(page, '')
    await banner.getByRole('button', { name: 'Continuar conectado' }).click()
    await expect(banner).toHaveCount(0)
    await expect(page.getByText('Sessão renovada.')).toBeVisible()
  })

  test('cenário session-expired: a renovação cai no fluxo de expiração', async ({ page }) => {
    const banner = await openWarning(page)

    await setScenarios(page, 'session-expired')
    await banner.getByRole('button', { name: 'Continuar conectado' }).click()

    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F$/)
    await expect(page.getByText(EXPIRED_TOAST)).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
})

test.describe('4. Expiração por tempo', () => {
  for (const origin of ['/carrinho', '/perfil/dados', '/']) {
    test(`em "${origin}": anúncio, toast, login com redirect e volta à origem`, async ({
      page,
    }, testInfo) => {
      await page.clock.install()
      await go(page)
      await signInBridge(page)
      if (origin !== '/') await navigate(page, origin)
      await collectAnnouncements(page)

      await page.clock.fastForward(SESSION_MS + 5_000)
      await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
      await page.clock.fastForward(100)
      await expect.poll(async () => announcements(page)).toContain('Sua sessão expirou.')

      await expect(page.getByText(EXPIRED_TOAST)).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=${encodeURIComponent(origin)}$`))
      expect(await storageValue(page, 'localStorage', 'kurio:session')).toBeNull()
      if (testInfo.project.name === 'desktop') {
        await expect(headerEntrar(page)).toBeVisible()
      }

      await signInForm(page, testInfo)
      await expect(page).toHaveURL(new RegExp(`${origin === '/' ? '/$' : `${origin}$`}`))
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    })
  }
})

test.describe('5. 401 SESSION_EXPIRED por cenário', () => {
  test('uma requisição protegida com o cenário session-expired leva ao login', async ({
    page,
  }, testInfo) => {
    await go(page)
    await signInBridge(page)
    await navigate(page, '/carrinho')
    await collectAnnouncements(page)

    await setScenarios(page, 'session-expired')
    await page.evaluate(`window.__kurio.auth.refreshSession().catch(() => null)`)

    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect.poll(async () => announcements(page)).toContain('Sua sessão expirou.')
    await expect(page.getByText(EXPIRED_TOAST)).toBeVisible()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho$/)
    expect(await storageValue(page, 'localStorage', 'kurio:session')).toBeNull()
    if (testInfo.project.name === 'desktop') {
      await expect(headerEntrar(page)).toBeVisible()
    }

    await setScenarios(page, '')
    await signInForm(page, testInfo)
    await expect(page).toHaveURL(/\/carrinho$/)
  })
})

test.describe('6. Logout', () => {
  test('[d] "Sair" leva à Início e limpa sessão, carrinho de visitante, checkout, cache, socket e carteira', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await signInBridge(page)
    await collectAnnouncements(page)

    // Planta o que o logout precisa apagar.
    await page.evaluate(`(() => {
      const k = window.__kurio
      for (const key of ['favorites', 'cart', 'wallets', 'orders']) k.queryClient.setQueryData([key], { x: 1 })
      sessionStorage.setItem('kurio:checkout', '{}')
      sessionStorage.setItem('kurio:checkout-draft', '{}')
      localStorage.setItem('kurio:guest-cart-id', 'guest-x')
    })()`)
    await page.evaluate(`window.__kurio.wallet.connect('metamask', 'ethereum')`)
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('connected')

    // Inscrição no socket: o evento de preço chega antes do logout.
    const nfts = await mockStores<{ id: string; edition: string }[]>(
      page,
      `return (await s.nftsStore.getAll()).slice(0, 2).map((n) => ({ id: n.id, edition: n.editions[0].id }))`,
    )
    const [subscribed, sentinel] = nfts
    await page.evaluate(`(() => {
      window.__prices = []
      const s = window.__kurio.socket
      s.onSocketEvent('nft:price_changed', (p) => window.__prices.push(p.nftId))
      s.subscribeNfts([${JSON.stringify(subscribed.id)}])
    })()`)
    let price = 5
    async function trigger(nft: { id: string; edition: string }) {
      price += 0.01
      await page.evaluate(
        `window.__kurioMock.triggerPriceChange(${JSON.stringify(nft.id)}, ${JSON.stringify(nft.edition)}, ${JSON.stringify(price.toFixed(2))})`,
      )
    }
    await expect
      .poll(async () => {
        await trigger(subscribed)
        return page.evaluate<string[]>('window.__prices')
      })
      .toContain(subscribed.id)

    await navigate(page, '/carrinho')
    await page.getByRole('button', { name: 'Menu de Teste Kurio' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page).toHaveURL('/')
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect(headerEntrar(page)).toBeVisible()
    expect(
      (await announcements(page)).filter((text) => text === 'Você saiu da sua conta'),
    ).toHaveLength(1)

    expect(await storageValue(page, 'localStorage', 'kurio:session')).toBeNull()
    expect(await storageValue(page, 'localStorage', 'kurio:guest-cart-id')).toBeNull()
    expect(await storageValue(page, 'sessionStorage', 'kurio:checkout')).toBeNull()
    expect(await storageValue(page, 'sessionStorage', 'kurio:checkout-draft')).toBeNull()
    expect(
      await page.evaluate<string[]>(`['favorites', 'cart', 'wallets', 'orders'].filter(
        (key) => window.__kurio.queryClient.getQueryData([key]) !== undefined)`),
    ).toEqual([])
    await expect
      .poll(() => page.evaluate<string>(`window.__kurio.wallet.state.status`))
      .toBe('disconnected')

    // Inscrições encerradas: o preço do NFT antes inscrito não chega mais. Um NFT sentinela,
    // inscrito depois, prova que o socket voltou a funcionar (sem esperar um tempo fixo).
    const countBefore = await page.evaluate<number>('window.__prices.length')
    await page.evaluate(`window.__kurio.socket.subscribeNfts([${JSON.stringify(sentinel.id)}])`)
    await trigger(subscribed)
    await expect
      .poll(async () => {
        await trigger(sentinel)
        return page.evaluate<string[]>(`window.__prices.slice(${countBefore})`)
      })
      .toContain(sentinel.id)
    expect(await page.evaluate<string[]>(`window.__prices.slice(${countBefore})`)).not.toContain(
      subscribed.id,
    )
  })
})

test.describe('7. Troca de usuário', () => {
  async function plantUserAData(page: Page) {
    await page.evaluate(`(() => {
      const k = window.__kurio
      k.queryClient.setQueryData(['favorites'], { ids: ['a'] })
      k.queryClient.setQueryData(['cart'], { id: 'cart-user-teste' })
      sessionStorage.setItem('kurio:checkout', JSON.stringify({ orderId: 'a' }))
      sessionStorage.setItem('kurio:checkout-draft', JSON.stringify({ note: 'rascunho de A' }))
    })()`)
  }

  async function expire(page: Page) {
    await page.evaluate(`window.__kurio.emitSessionExpired()`)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
  }

  test('outro usuário: nada de A sobrevive e os dados de B aparecem', async ({ page }) => {
    await go(page)
    await signInBridge(page, users.primary)
    await plantUserAData(page)
    await expire(page)
    // A expiração sozinha preserva os dados de A (o mesmo usuário poderá retomar).
    expect(await storageValue(page, 'sessionStorage', 'kurio:checkout-draft')).not.toBeNull()

    await signInBridge(page, users.other)

    const state = await page.evaluate<Record<string, unknown>>(`(() => {
      const k = window.__kurio
      return {
        favorites: k.queryClient.getQueryData(['favorites']) !== undefined,
        cart: k.queryClient.getQueryData(['cart']) !== undefined,
        checkout: sessionStorage.getItem('kurio:checkout'),
        draft: sessionStorage.getItem('kurio:checkout-draft'),
      }
    })()`)
    expect(state).toEqual({ favorites: false, cart: false, checkout: null, draft: null })

    // O que vem do servidor agora é de B.
    // (O mock ainda não tem rotas de carrinho, favoritos ou carteiras: a sessão é o dado de B.)
    const fromServer = await page.evaluate<{ user: { id: string } }>(
      `window.__kurio.http.get('/auth/session').then((response) => response.data)`,
    )
    expect(fromServer.user.id).toBe('user-outro')
    expect((await authState(page)).user?.id).toBe('user-outro')
  })

  test('o mesmo usuário depois de expirar preserva checkout e rascunho', async ({ page }) => {
    await go(page)
    await signInBridge(page, users.primary)
    await plantUserAData(page)
    await expire(page)

    await signInBridge(page, users.primary)

    expect(await storageValue(page, 'sessionStorage', 'kurio:checkout')).toBe('{"orderId":"a"}')
    expect(await storageValue(page, 'sessionStorage', 'kurio:checkout-draft')).toBe(
      '{"note":"rascunho de A"}',
    )
    expect(
      await page.evaluate<boolean>(
        `window.__kurio.queryClient.getQueryData(['favorites']) !== undefined`,
      ),
    ).toBe(true)
  })
})

test.describe('8. Mescla do carrinho do visitante', () => {
  const GUEST = 'guest-session-spec'

  type Planted = { name: string; label: string }

  // Estoque 3 no primeiro NFT e 10 no segundo; o visitante pediu 5 e 2.
  async function plantGuestCart(page: Page, quantities: [number, number]) {
    return mockStores<[Planted, Planted]>(
      page,
      `
      const nfts = (await s.nftsStore.getAll()).sort((x, y) => x.id.localeCompare(y.id)).slice(0, 2)
      const stock = [3, 10]
      const quantities = ${JSON.stringify(quantities)}
      const { multiplyEth } = window.__kurioMock.money
      const items = []
      for (let i = 0; i < nfts.length; i += 1) {
        const nft = nfts[i]
        nft.editions = nft.editions.map((ed, index) => index === 0 ? { ...ed, available: stock[i] } : ed)
        await s.nftsStore.put(nft)
        const ed = nft.editions[0]
        items.push({
          id: 'line-' + i,
          nft: { id: nft.id, name: nft.name, tokenId: nft.tokenId, image: nft.image, price: nft.price, collection: nft.collection, network: nft.network },
          edition: { id: ed.id, label: ed.label },
          quantity: quantities[i],
          unitPrice: ed.price,
          lineTotal: multiplyEth(ed.price, quantities[i]),
          availability: 'available',
          available: ed.available,
        })
      }
      await s.cartsStore.put({
        id: ${JSON.stringify(GUEST)}, ownerId: ${JSON.stringify(GUEST)}, items,
        itemCount: quantities[0] + quantities[1], version: 0,
      })
      localStorage.setItem('kurio:guest-cart-id', ${JSON.stringify(GUEST)})
      return nfts.map((n) => ({ name: n.name, label: n.editions[0].label }))
    `,
    )
  }

  async function mergedCart(page: Page) {
    return mockStores<{ guest: boolean; quantities: number[] }>(
      page,
      `
      const cart = await s.cartsStore.get('cart-user-teste')
      return {
        guest: (await s.cartsStore.get(${JSON.stringify(GUEST)})) !== undefined,
        quantities: (cart?.items ?? []).map((item) => item.quantity).sort(),
      }
    `,
    )
  }

  test('login: aviso de ajuste por estoque, carrinho do usuário correto e o do visitante some', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const [first] = await plantGuestCart(page, [5, 2])

    await signInForm(page, testInfo)

    await expect(page.getByText('Ajustamos o seu carrinho')).toBeVisible()
    await expect(
      page.getByText(
        `Ajustamos ${first.name} (${first.label}) de 5 para 3 unidades, o estoque disponível.`,
      ),
    ).toBeVisible()
    await expect(page.getByText(/Ajustamos .* de 2 para/)).toHaveCount(0)

    expect(await mergedCart(page)).toEqual({ guest: false, quantities: [2, 3] })
  })

  test('login sem ajustes: nenhum aviso, mas o carrinho é mesclado', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    await plantGuestCart(page, [2, 2])

    await signInForm(page, testInfo)

    await expect(page).toHaveURL('/')
    await expect.poll(async () => (await mergedCart(page)).guest).toBe(false)
    expect((await mergedCart(page)).quantities).toEqual([2, 2])
    await expect(page.getByText('Ajustamos o seu carrinho')).toHaveCount(0)
  })

  test('cadastro: o mesmo aviso e a mesma mescla', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const [first] = await plantGuestCart(page, [5, 2])
    const form = scope(page, testInfo)
    const suffix = Date.now().toString(36)
    const password = `Aa1${Math.random().toString(36).slice(2, 12)}`

    await form.getByLabel('Nome de usuário').fill(`m${suffix}`)
    await form.getByLabel('E-mail').fill(`m${suffix}@kurio.test`)
    await form.getByLabel('Senha', { exact: true }).fill(password)
    await form.getByLabel('Confirmar senha').fill(password)
    await form
      .getByRole('button', {
        name: testInfo.project.name === 'desktop' ? 'Criar conta' : 'Criar perfil',
        exact: true,
      })
      .click()

    await expect(page.getByText('Ajustamos o seu carrinho')).toBeVisible()
    await expect(
      page.getByText(
        `Ajustamos ${first.name} (${first.label}) de 5 para 3 unidades, o estoque disponível.`,
      ),
    ).toBeVisible()
    const userId = (await authState(page)).user?.id
    const cart = await mockStores<number[]>(
      page,
      `return ((await s.cartsStore.get('cart-' + ${JSON.stringify(userId)}))?.items ?? []).map((i) => i.quantity).sort()`,
    )
    expect(cart).toEqual([2, 3])
    expect(
      await mockStores<boolean>(
        page,
        `return (await s.cartsStore.get(${JSON.stringify(GUEST)})) !== undefined`,
      ),
    ).toBe(false)
  })
})

test.describe('9. Ação pendente', () => {
  const REGISTER = (body: string) =>
    `window.__kurio.pendingAction.registerPendingExecutor('favorite', ${body})`
  const SAVE = `window.__kurio.pendingAction.savePendingAction({ type: 'favorite', nftId: 'x' })`

  test('o executor roda uma vez, o toast mostra a mensagem e o login volta ao redirect', async ({
    page,
  }, testInfo) => {
    await go(page)
    await page.evaluate(`(() => {
      window.__ran = 0
      ${REGISTER(`async (action) => { window.__ran += 1; return 'Favoritado: ' + action.nftId }`)}
      ${SAVE}
    })()`)
    // Navegação do roteador (sem recarregar): os executores vivem só em memória.
    await page.evaluate(
      `window.__kurio.router.navigate({ to: '/entrar', search: { redirect: '/carrinho' } })`,
    )
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho$/)

    await signInForm(page, testInfo)

    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Favoritado: x')).toBeVisible()
    expect(await page.evaluate<number>('window.__ran')).toBe(1)
    expect(await storageValue(page, 'sessionStorage', 'kurio:pending-action')).toBeNull()
  })

  test('executor que rejeita: toast de erro e o login continua válido', async ({
    page,
  }, testInfo) => {
    await go(page)
    await page.evaluate(`(() => {
      ${REGISTER(`async () => { throw new Error('falhou') }`)}
      ${SAVE}
    })()`)
    await page.evaluate(
      `window.__kurio.router.navigate({ to: '/entrar', search: { redirect: '/carrinho' } })`,
    )

    await signInForm(page, testInfo)

    await expect(
      page.getByText('Não foi possível concluir a ação que você pediu. Tente de novo.'),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  })

  test('ação com mais de 10 minutos é ignorada', async ({ page }, testInfo) => {
    await page.clock.install()
    await go(page)
    await page.evaluate(`(() => {
      window.__ran = 0
      ${REGISTER(`async () => { window.__ran += 1; return 'não deveria rodar' }`)}
      ${SAVE}
    })()`)
    await page.clock.fastForward('10:01')
    await page.evaluate(`window.__kurio.router.navigate({ to: '/entrar' })`)

    await signInForm(page, testInfo)

    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await expect(page).toHaveURL('/')
    expect(await page.evaluate<number>('window.__ran')).toBe(0)
    await expect(page.getByText('não deveria rodar')).toHaveCount(0)
    expect(
      await page.evaluate<unknown>('window.__kurio.pendingAction.readPendingAction()'),
    ).toBeNull()
  })

  test('sem executor registrado: nenhum erro e o login continua válido', async ({
    page,
  }, testInfo) => {
    await go(page)
    await page.evaluate(SAVE)
    await page.evaluate(`window.__kurio.router.navigate({ to: '/entrar' })`)

    await signInForm(page, testInfo)

    await expect(page).toHaveURL('/')
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await expect(page.getByText('Não foi possível concluir a ação')).toHaveCount(0)
  })

  // O bloco pede que a ação sem executor seja DESCARTADA. Hoje runPendingAction devolve null antes
  // de limpar, então ela continua no sessionStorage (até vencer em 10 minutos). Decisão do usuário.
  test.fixme('sem executor registrado: a ação é descartada', async ({ page }, testInfo) => {
    await go(page)
    await page.evaluate(SAVE)
    await page.evaluate(`window.__kurio.router.navigate({ to: '/entrar' })`)

    await signInForm(page, testInfo)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

    expect(await storageValue(page, 'sessionStorage', 'kurio:pending-action')).toBeNull()
  })
})
