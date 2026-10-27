// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, delayApi, only, openApp, ready, recordApi, signInAs } from './helpers.ts'

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

function authScope(page: Page, testInfo: TestInfo): Locator {
  return isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
}

function newAccount() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return {
    username: `u${suffix}`.slice(0, 20),
    email: `u${suffix}@kurio.test`,
    password: `Aa1${Math.random().toString(36).slice(2, 12)}`,
  }
}

test.describe('Início — Card: foco, selos, favoritar e adicionar ao carrinho', () => {
  test('1. ações aparecem com foco (:focus-within) [d], selos de raridade e esgotado (sem carrinho ativo) e Enter no card abre /nft/$id', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    const firstCard = cards(page).first()
    const titleLink = firstCard.getByRole('heading', { level: 3 }).getByRole('link')

    if (isDesktop(testInfo)) {
      const cartBtn = firstCard.getByRole('button', {
        name: 'Adicionar Emerald Ape #042 ao carrinho',
      })
      const favBtn = firstCard.getByRole('button', { name: 'Favoritar Emerald Ape #042' })

      // Coração e carrinho são botões separados com aria-label
      await expect(cartBtn).toBeAttached()
      await expect(favBtn).toBeAttached()

      // Antes do foco/hover, a barra de ações está com opacity 0; com foco no link (:focus-within), vira 1
      const opacityBefore = await cartBtn.evaluate(
        (el) => getComputedStyle(el.parentElement ?? el).opacity,
      )
      expect(opacityBefore).toBe('0')

      await titleLink.focus()
      await expect
        .poll(() => cartBtn.evaluate((el) => getComputedStyle(el.parentElement ?? el).opacity))
        .toBe('1')
    } else {
      await expect(
        firstCard.getByRole('button', { name: 'Favoritar Emerald Ape #042' }),
      ).toBeVisible()
    }

    // Selo de raridade "RARO" no Neon Vessel #552 (3º card da 1ª página)
    const rareCard = cards(page).filter({ hasText: 'Neon Vessel #552' })
    await expect(rareCard.getByText('RARO', { exact: true })).toBeVisible()

    // Selo "Esgotado" em um NFT sem estoque e sem botão de carrinho ativo
    const soldOutName = await page.evaluate<string>(`(async () => {
      const all = await window.__kurioMock.stores.nftsStore.getAll()
      const found = all.find((nft) => nft.editions.length > 0 && nft.editions.every((e) => e.available === 0))
      return found ? found.name : ''
    })()`)
    expect(soldOutName).not.toBe('')

    await page.goto(`/?q=${encodeURIComponent(soldOutName)}`)
    await ready(page)
    const soldOutCard = cards(page).filter({ hasText: soldOutName })
    await expect(soldOutCard).toBeVisible()
    await expect(soldOutCard.getByText('Esgotado').filter({ visible: true }).first()).toBeVisible()

    if (isDesktop(testInfo)) {
      await expect(
        soldOutCard.getByRole('button', { name: `Adicionar ${soldOutName} ao carrinho` }),
      ).toHaveCount(0)
      const disabledAction = soldOutCard.getByRole('button', { name: 'Esgotado' })
      await expect(disabledAction).toHaveAttribute('aria-disabled', 'true')
    }

    // Enter no link do card abre /nft/$id
    await page.goto('/')
    await ready(page)
    const link = cards(page).first().getByRole('heading', { level: 3 }).getByRole('link')
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
  })

  test('2. favoritar logado é otimista, ignora cliques repetidos em voo e desfaz com erro 500 mantendo o foco', async ({
    page,
  }) => {
    const api = recordApi(page)
    await openApp(page)
    await signInAs(page, 'other')
    await expect(cards(page)).toHaveCount(9)

    const firstCard = cards(page).first()
    const favBtn = firstCard.getByRole('button', { name: 'Favoritar Emerald Ape #042' })
    await expect(favBtn).toHaveAttribute('aria-pressed', 'false')

    // Atrasa o PUT para conferir atualização otimista imediata e proteção contra duplo clique
    await delayApi(page, '**/api/favorites/*', 400, { once: true })
    api.clear()

    await favBtn.click({ force: true })
    await favBtn.click({ force: true })

    // Muda na hora (otimista) antes da resposta
    await expect(favBtn).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => favBtn.getAttribute('aria-busy')).toBeNull()
    expect(api.calls('PUT', '/favorites/emerald-ape-042')).toHaveLength(1)

    // Erro 500 ao favoritar o 2º card: muda otimisticamente, depois desfaz, avisa e mantém o foco
    const secondCard = cards(page).nth(1)
    const secondFavBtn = secondCard.getByRole('button', { name: 'Favoritar Sage Nomad #009' })
    await expect(secondFavBtn).toHaveAttribute('aria-pressed', 'false')

    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:PUT /favorites/:nftId')`,
    )
    await secondFavBtn.focus()
    await secondFavBtn.click({ force: true })

    // Após falha, aria-pressed volta para false, exibe mensagem de erro e preserva o foco no botão
    await expect(secondFavBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByText('Não foi possível favoritar Sage Nomad #009. Tente de novo.'),
    ).toBeVisible()
    await expect(secondFavBtn).toBeFocused()

    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
  })

  test('3. favoritar deslogado redireciona a /entrar e conclui a ação pendente após login e após cadastro', async ({
    page,
  }, testInfo) => {
    await openApp(page)

    // 1) Fluxo via Login (users.other começa sem favoritos)
    const firstCard = cards(page).first()
    await firstCard
      .getByRole('button', { name: 'Favoritar Emerald Ape #042' })
      .click({ force: true })
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F$/)

    const loginForm = authScope(page, testInfo)
    await loginForm.getByLabel('E-mail').fill(users.other.email)
    await loginForm.getByLabel('Senha', { exact: true }).fill(users.other.password)
    await loginForm.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(
      cards(page).first().getByRole('button', { name: 'Favoritar Emerald Ape #042' }),
    ).toHaveAttribute('aria-pressed', 'true')

    // Sai da conta para testar o fluxo via Cadastro
    await page.evaluate(`window.__kurio.auth.signOut()`)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')

    // 2) Fluxo via Cadastro
    const secondCard = cards(page).nth(1)
    await secondCard
      .getByRole('button', { name: 'Favoritar Sage Nomad #009' })
      .click({ force: true })
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F$/)

    if (isDesktop(testInfo)) {
      await page
        .getByRole('dialog')
        .getByRole('navigation', { name: 'Entrar ou criar conta' })
        .getByRole('link', { name: 'Criar conta' })
        .click()
    } else {
      await page.getByRole('link', { name: 'Crie uma conta' }).click()
    }
    await expect(page).toHaveURL(/\/cadastro\?redirect=%2F$/)

    const signupForm = authScope(page, testInfo)
    const account = newAccount()
    await signupForm.getByLabel('Nome de usuário').fill(account.username)
    await signupForm.getByLabel('E-mail').fill(account.email)
    await signupForm.getByLabel('Senha', { exact: true }).fill(account.password)
    await signupForm.getByLabel('Confirmar senha').fill(account.password)
    const submitName = isDesktop(testInfo) ? 'Criar conta' : 'Criar perfil'
    await signupForm.getByRole('button', { name: submitName, exact: true }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(
      cards(page).nth(1).getByRole('button', { name: 'Favoritar Sage Nomad #009' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('4. [d] carrinho pelo card: adiciona 1 unidade, controla aria-busy em cliques repetidos, trata erros (5xx, rede, SOLD_OUT, QUANTITY_EXCEEDS_STOCK) e mescla carrinho de visitante no login', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    // Prepara 1 item no carrinho do usuário logado (users.primary) no mock para conferir a mesclagem depois
    await page.evaluate(`(async () => {
      const { cartsStore, nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('ivory-baron-088')
      const edition = nft.editions[0]
      await cartsStore.put({
        id: 'cart-user-teste',
        ownerId: 'user-teste',
        items: [{
          id: 'item-seed-user',
          nft: {
            id: nft.id,
            name: nft.name,
            tokenId: nft.tokenId,
            image: nft.image,
            price: edition.price,
            collection: nft.collection,
            network: nft.network,
            soldOut: false,
            defaultEditionId: edition.id,
          },
          edition: { id: edition.id, label: edition.label },
          quantity: 1,
          unitPrice: edition.price,
          lineTotal: edition.price,
          availability: 'available',
          available: edition.available,
        }],
        itemCount: 1,
        version: 1,
      })
    })()`)

    const firstCard = cards(page).first()
    const addEmeraldBtn = firstCard.getByRole('button', {
      name: 'Adicionar Emerald Ape #042 ao carrinho',
    })

    // Cliques repetidos durante requisição em andamento geram uma única chamada por clique ativo (aria-busy)
    await delayApi(page, '**/api/cart/items', 400, { once: true })
    api.clear()

    await addEmeraldBtn.click({ force: true })
    await expect(addEmeraldBtn).toHaveAttribute('aria-busy', 'true')
    await addEmeraldBtn.click({ force: true })

    await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()
    await expect(addEmeraldBtn).not.toHaveAttribute('aria-busy', 'true')
    expect(api.calls('POST', '/cart/items')).toHaveLength(1)
    expect(api.last('POST', '/cart/items')?.body).toEqual({
      nftId: 'emerald-ape-042',
      editionId: 'emerald-ape-042-1-50',
      quantity: 1,
    })
    expect(api.last('POST', '/cart/items')?.headers['x-cart-id']).toBeTruthy()
    await expect(page.getByText('Emerald Ape #042 adicionado ao carrinho')).toBeVisible()

    // Novo clique ativo após liberar o botão envia nova requisição e soma 2 unidades no contador
    await addEmeraldBtn.click({ force: true })
    await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
    expect(api.calls('POST', '/cart/items')).toHaveLength(2)

    // Erro 5xx e erro de rede mostram toast e liberam o botão
    for (const scenario of ['server-error:POST /cart/items', 'network-error:POST /cart/items']) {
      await page.evaluate(
        `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenario)})`,
      )
      await addEmeraldBtn.click({ force: true })
      await expect(
        page.getByText('Não foi possível adicionar Emerald Ape #042 ao carrinho. Tente de novo.'),
      ).toBeVisible()
      await expect(addEmeraldBtn).not.toHaveAttribute('aria-busy', 'true')
      await page.evaluate(`window.__kurio.toast.dismiss()`)
    }
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)

    // QUANTITY_EXCEEDS_STOCK: ajusta o estoque da edição do 2º card para 1, adiciona 1x e tenta a 2ª
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('sage-nomad-009')
      for (const ed of nft.editions) ed.available = 1
      await nftsStore.put(nft)
    })()`)
    const addSageBtn = cards(page)
      .nth(1)
      .getByRole('button', { name: 'Adicionar Sage Nomad #009 ao carrinho' })
    await addSageBtn.click({ force: true })
    await expect(page.getByRole('link', { name: 'Carrinho, 3 itens' })).toBeVisible()

    await addSageBtn.click({ force: true })
    await expect(
      page.getByText('Você já tem o máximo disponível de Sage Nomad #009 no carrinho.'),
    ).toBeVisible()

    // SOLD_OUT: esgota no banco antes do clique e verifica a mensagem específica
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('cosmic-bloom-118')
      for (const ed of nft.editions) ed.available = 0
      await nftsStore.put(nft)
    })()`)
    const addCosmicBtn = cards(page)
      .nth(3)
      .getByRole('button', { name: 'Adicionar Cosmic Bloom #118 ao carrinho' })
    await addCosmicBtn.click({ force: true })
    await expect(page.getByText('Cosmic Bloom #118 esgotou.')).toBeVisible()

    // Faz login e confere que o carrinho do visitante (3 unidades) foi mesclado ao do usuário (+1 unidade = 4 itens)
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await dialog.getByLabel('E-mail').fill(users.primary.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page.getByRole('link', { name: 'Carrinho, 4 itens' })).toBeVisible()
  })
})
