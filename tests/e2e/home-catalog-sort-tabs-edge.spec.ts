// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, openApp, ready, recordApi, signInAs } from './helpers.ts'

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

async function cardNames(page: Page): Promise<string[]> {
  const headings = cards(page).getByRole('heading', { level: 3 })
  const count = await headings.count()
  const names: string[] = []
  for (let i = 0; i < count; i += 1) {
    names.push((await headings.nth(i).innerText()).trim())
  }
  return names
}

async function cardPrices(page: Page): Promise<number[]> {
  return page.evaluate<number[]>(`(() => {
    const items = document.querySelectorAll('#catalogo article[data-nft-id]')
    return Array.from(items, (item) => {
      const priceEl = item.querySelector('.text-price')
      const raw = (priceEl?.textContent ?? '').replace('preço atual', '').replace('ETH', '').trim()
      return Number(raw)
    })
  })()`)
}

async function selectSort(page: Page, testInfo: TestInfo, label: string) {
  if (isDesktop(testInfo)) {
    await page.getByRole('combobox', { name: 'Ordenar por' }).click()
    await page.getByRole('option', { name: label }).click()
    return
  }

  await page.getByRole('button', { name: /^Filtros/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  await expect(sheet).toBeVisible()
  await sheet.getByRole('combobox', { name: 'Ordenar por' }).click()
  await page.getByRole('option', { name: label }).click()
  await sheet.getByRole('button', { name: /^(Ver |Nenhum resultado)/ }).click()
  await expect(sheet).toHaveCount(0)
}

function authScope(page: Page, testInfo: TestInfo): Locator {
  return isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
}

test.describe('Início — Catálogo: ordenações, abas e favoritos', () => {
  test('1. as 5 ordenações atualizam a URL, enviam a chave certa para GET /nfts e ordenam os cards', async ({
    page,
  }, testInfo) => {
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    // Padrão inicial: Listados recentemente (sem sort na query e sem ordem na URL).
    expect(api.last('GET', '/nfts')?.query.sort).toBeUndefined()
    const recentExpected = await page.evaluate<string[]>(`(async () => {
      const res = await fetch('/api/nfts?page=1&pageSize=9')
      const data = await res.json()
      return data.items.map((item) => item.name)
    })()`)
    expect(await cardNames(page)).toEqual(recentExpected)

    // 1) Menor preço -> price_asc
    api.clear()
    await selectSort(page, testInfo, 'Menor preço')
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.sort).toBe('price_asc')
    await expect
      .poll(async () => {
        const prices = await cardPrices(page)
        return (
          prices.length === 9 &&
          prices.every((price, idx) => idx === 0 || (prices[idx - 1] ?? 0) <= price)
        )
      })
      .toBe(true)

    // 2) Maior preço -> price_desc
    api.clear()
    await selectSort(page, testInfo, 'Maior preço')
    await expect(page).toHaveURL(/ordem=maior-preco/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.sort).toBe('price_desc')
    await expect
      .poll(async () => {
        const prices = await cardPrices(page)
        return (
          prices.length === 9 &&
          prices.every((price, idx) => idx === 0 || (prices[idx - 1] ?? 0) >= price)
        )
      })
      .toBe(true)

    // 3) Mais bem avaliados -> top_rated (média desc, contagem desc)
    api.clear()
    await selectSort(page, testInfo, 'Mais bem avaliados')
    await expect(page).toHaveURL(/ordem=mais-avaliados/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.sort).toBe('top_rated')
    const topRatedExpected = await page.evaluate<string[]>(`(async () => {
      const all = await window.__kurioMock.stores.nftsStore.getAll()
      const sorted = [...all].sort((a, b) =>
        b.rating.average - a.rating.average ||
        b.rating.count - a.rating.count ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      )
      return sorted.slice(0, 9).map((item) => item.name)
    })()`)
    await expect.poll(() => cardNames(page)).toEqual(topRatedExpected)

    // 4) Mais favoritados -> most_favorited
    api.clear()
    await selectSort(page, testInfo, 'Mais favoritados')
    await expect(page).toHaveURL(/ordem=mais-favoritados/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.sort).toBe('most_favorited')
    const mostFavoritedExpected = await page.evaluate<string[]>(`(async () => {
      const res = await fetch('/api/nfts?page=1&pageSize=9&sort=most_favorited')
      const data = await res.json()
      return data.items.map((item) => item.name)
    })()`)
    await expect.poll(() => cardNames(page)).toEqual(mostFavoritedExpected)

    // 5) Volta para Listados recentemente -> remove ordem da URL e restaura a lista padrão
    await selectSort(page, testInfo, 'Listados recentemente')
    await expect(page).not.toHaveURL(/ordem=/)
    await expect.poll(() => cardNames(page)).toEqual(recentExpected)
  })

  test('2. abas "Novos lançamentos" e "Em alta" combinam com filtros e ordem, mantendo aria-selected e URL', async ({
    page,
  }, testInfo) => {
    const api = recordApi(page)
    await openApp(page)

    const tabTodos = page.getByRole('tab', { name: 'Todos os NFTs' })
    const tabNovos = page.getByRole('tab', { name: 'Novos lançamentos' })
    const tabEmAlta = page.getByRole('tab', { name: 'Em alta' })

    await expect(tabTodos).toHaveAttribute('aria-selected', 'true')
    await expect(tabNovos).toHaveAttribute('aria-selected', 'false')
    await expect(tabEmAlta).toHaveAttribute('aria-selected', 'false')

    // Aba "Novos lançamentos" -> aba=novos e tab=new na API
    api.clear()
    await tabNovos.click()
    await expect(page).toHaveURL(/aba=novos/)
    await expect(tabNovos).toHaveAttribute('aria-selected', 'true')
    await expect(tabTodos).toHaveAttribute('aria-selected', 'false')
    await expect.poll(() => api.last('GET', '/nfts')?.query.tab).toBe('new')

    // Aba "Em alta" -> aba=em-alta e tab=trending na API
    api.clear()
    await tabEmAlta.click()
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(tabEmAlta).toHaveAttribute('aria-selected', 'true')
    await expect(tabNovos).toHaveAttribute('aria-selected', 'false')
    await expect.poll(() => api.last('GET', '/nfts')?.query.tab).toBe('trending')

    // Combina com filtro de rede (Ethereum) e ordenação (Menor preço)
    if (isDesktop(testInfo)) {
      await page.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
    } else {
      await page.getByRole('button', { name: /^Filtros/ }).click()
      const sheet = page.getByRole('dialog', { name: 'Filtros' })
      await sheet.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
      await sheet.getByRole('button', { name: /^(Ver |Nenhum resultado)/ }).click()
      await expect(sheet).toHaveCount(0)
    }
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page).toHaveURL(/rede=ethereum/)

    api.clear()
    await selectSort(page, testInfo, 'Menor preço')
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page).toHaveURL(/rede=ethereum/)
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect(tabEmAlta).toHaveAttribute('aria-selected', 'true')

    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toMatchObject({
        tab: 'trending',
        network: 'ethereum',
        sort: 'price_asc',
      })

    await expect
      .poll(async () => {
        const prices = await cardPrices(page)
        return (
          prices.length > 0 &&
          prices.every((price, idx) => idx === 0 || (prices[idx - 1] ?? 0) <= price)
        )
      })
      .toBe(true)

    // Voltar para "Todos os NFTs" preserva filtro e ordem
    api.clear()
    await tabTodos.click()
    await expect(tabTodos).toHaveAttribute('aria-selected', 'true')
    await expect(page).not.toHaveURL(/aba=/)
    await expect(page).toHaveURL(/rede=ethereum/)
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.network).toBe('ethereum')
    expect(api.last('GET', '/nfts')?.query.tab).toBeUndefined()
  })

  test('3. /?favoritos=1 redireciona deslogado ao login e volta filtrado; logado mostra favoritos (pagina volta a 1) ou EmptyState quando vazio', async ({
    page,
  }, testInfo) => {
    const api = recordApi(page)

    // Deslogado: abrir /?favoritos=1 redireciona para /entrar com redirect
    await page.goto('/?favoritos=1')
    await ready(page)
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F%3Ffavoritos%3D1$/)

    // Faz login e volta já filtrado em /?favoritos=1
    const form = authScope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/\?favoritos=1$/)
    await expect(
      page.locator('#catalogo').getByRole('heading', { level: 2, name: 'Seus favoritos' }),
    ).toBeVisible()
    await expect.poll(() => api.last('GET', '/nfts')?.query.favorites).toBe('1')
    await expect(cards(page)).toHaveCount(9)

    // Todos os cards exibidos estão marcados como favoritos
    const allPressed = await cards(page)
      .getByRole('button', { name: /^Favoritar / })
      .evaluateAll(
        (buttons) =>
          buttons.length >= 9 && buttons.every((b) => b.getAttribute('aria-pressed') === 'true'),
      )
    expect(allPressed).toBe(true)

    // Quando está na página 2 do catálogo e ativa filtro/aba em favoritos, pagina volta a 1
    if (isDesktop(testInfo)) {
      await page.getByRole('link', { name: 'Página 2' }).click()
      await expect(page).toHaveURL(/pagina=2/)
      api.clear()
      await page.getByRole('tab', { name: 'Novos lançamentos' }).click()
      await expect(page).not.toHaveURL(/pagina=/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.page).toBe('1')
    } else {
      await page.getByRole('button', { name: 'Carregar mais' }).click()
      await expect(cards(page)).toHaveCount(12)
      api.clear()
      await page.getByRole('tab', { name: 'Novos lançamentos' }).click()
      await expect(page).not.toHaveURL(/pagina=/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.pageSize).toBe('9')
    }

    // Sem favoritos (users.other não tem favoritos no seed): EmptyState com ação "Explorar NFTs"
    await page.evaluate(`window.__kurio.auth.signOut()`)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await signInAs(page, 'other')
    await page.goto('/?favoritos=1')
    await ready(page)

    await expect(
      page.getByRole('heading', { level: 3, name: 'Você ainda não favoritou nenhum NFT' }),
    ).toBeVisible()
    const exploreLink = page.locator('#catalogo').getByRole('link', { name: 'Explorar NFTs' })
    await expect(exploreLink).toBeVisible()
    await exploreLink.click()
    await expect(page).toHaveURL(/\/$/)
    await expect(cards(page)).toHaveCount(9)
  })
})
