/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { openApp, recordApi, signInAs } from './helpers.ts'

const SEED_COLLECTIONS = [
  { id: 'arte-digital', name: 'Arte digital', count: 39 },
  { id: 'fotografia', name: 'Fotografia', count: 14 },
  { id: 'musica', name: 'Música', count: 77 },
  { id: 'arte-3d', name: 'Arte 3D', count: 46 },
  { id: 'colecionaveis', name: 'Colecionáveis', count: 27 },
  { id: 'generativa', name: 'Generativa', count: 20 },
  { id: 'jogos', name: 'Jogos', count: 23 },
  { id: 'assinaturas', name: 'Assinaturas', count: 16 },
  { id: 'utilidade', name: 'Utilidade', count: 21 },
] as const

const SEED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', count: 119 },
  { id: 'polygon', name: 'Polygon', count: 78 },
  { id: 'solana', name: 'Solana', count: 86 },
] as const

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

async function openFilterContainer(page: Page, testInfo: TestInfo): Promise<Locator> {
  if (testInfo.project.name !== 'mobile') {
    const aside = page.getByRole('complementary', { name: 'Filtros' })
    await expect(aside).toBeVisible()
    return aside
  }
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  if (!(await sheet.isVisible())) {
    await page.getByRole('button', { name: /^Filtros/ }).click()
    await expect(sheet).toBeVisible()
  }
  return sheet
}

async function closeFilterSheetIfMobile(page: Page, testInfo: TestInfo) {
  if (testInfo.project.name !== 'mobile') return
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  if (await sheet.isVisible()) {
    await sheet.getByRole('button', { name: /^(Ver |Nenhum resultado)/ }).click()
    await expect(sheet).toHaveCount(0)
  }
}

test.describe('Início — catálogo: filtros combinados, parâmetros da API, limpar e contagens (13-023)', () => {
  test('1. filtros combinados (coleção + rede + faixa de preço) e parâmetros exatos de GET /api/nfts; preço só vai no "Aplicar"', async ({
    page,
  }, testInfo) => {
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page).first()).toBeVisible()

    const container = await openFilterContainer(page, testInfo)

    // 1) Seleciona coleção "Música".
    await container.getByRole('button', { name: /^Música, \d+ NFTs$/ }).click()
    await expect(page).toHaveURL(/colecao=musica/)
    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toEqual({
        page: '1',
        pageSize: '9',
        collection: 'musica',
      })

    // 2) Seleciona rede "Ethereum" combinada com a coleção.
    await container.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
    await expect(page).toHaveURL(/colecao=musica/)
    await expect(page).toHaveURL(/rede=ethereum/)
    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toEqual({
        page: '1',
        pageSize: '9',
        collection: 'musica',
        network: 'ethereum',
      })

    // 3) Mexe na faixa de preço sem clicar em "Aplicar": não altera URL nem dispara chamada à API.
    const minSlider = container.getByRole('slider', { name: 'Preço mínimo' })
    const maxSlider = container.getByRole('slider', { name: 'Preço máximo' })
    const applyButton = container.getByRole('button', { name: 'Aplicar' })
    await expect(applyButton).toHaveAttribute('aria-disabled', 'true')

    const countBeforeSlider = api.calls('GET', '/nfts').length
    await minSlider.focus()
    await page.keyboard.press('PageUp')
    await maxSlider.focus()
    await page.keyboard.press('PageDown')

    const draftMin = Number(await minSlider.getAttribute('aria-valuenow'))
    const draftMax = Number(await maxSlider.getAttribute('aria-valuenow'))
    await expect(applyButton).not.toHaveAttribute('aria-disabled', 'true')
    await expect(page).not.toHaveURL(/precoMin=|precoMax=/)
    expect(api.calls('GET', '/nfts').length).toBe(countBeforeSlider)

    // 4) Clica em "Aplicar": agora atualiza a URL e envia minPrice e maxPrice exatos à API.
    await applyButton.click()
    await closeFilterSheetIfMobile(page, testInfo)

    await expect(page).toHaveURL(new RegExp(`precoMin=${draftMin}`))
    await expect(page).toHaveURL(new RegExp(`precoMax=${draftMax}`))
    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toEqual({
        page: '1',
        pageSize: '9',
        collection: 'musica',
        network: 'ethereum',
        minPrice: draftMin.toFixed(2),
        maxPrice: draftMax.toFixed(2),
      })
  })

  test('2. mudar filtro, ordem ou aba volta à página 1 sem resetar o scroll; "Limpar filtros" mantém aba, ordem, favoritos e scroll', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    const scrollY = () => page.evaluate<number>('window.scrollY')

    // Vai para a página 2 (desktop: Paginação; mobile: Carregar mais) e garante scroll no catálogo.
    if (isDesktop) {
      await page.getByRole('link', { name: 'Página 2' }).click()
    } else {
      await page.getByRole('button', { name: 'Carregar mais' }).click()
    }
    await expect(page).toHaveURL(/pagina=2/)
    await page.evaluate('document.querySelector("#catalogo")?.scrollIntoView({ block: "start" })')
    await expect.poll(scrollY).toBeGreaterThan(50)

    // 1) Mudar filtro volta à página 1 (pagina some da URL) e mantém o scroll no catálogo.
    const filterBox1 = await openFilterContainer(page, testInfo)
    await filterBox1.getByRole('button', { name: /^Música, \d+ NFTs$/ }).click()
    await closeFilterSheetIfMobile(page, testInfo)

    await expect(page).toHaveURL(/colecao=musica/)
    await expect(page).not.toHaveURL(/pagina=/)
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    // Volta à página 2 para testar mudança de ordenação.
    if (isDesktop) {
      await page.getByRole('link', { name: 'Página 2' }).click()
    } else {
      await page.getByRole('button', { name: 'Carregar mais' }).click()
    }
    await expect(page).toHaveURL(/pagina=2/)
    await page.evaluate('document.querySelector("#catalogo")?.scrollIntoView({ block: "start" })')
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    // 2) Mudar ordenação volta à página 1 e mantém o scroll no catálogo.
    if (isDesktop) {
      await page.getByRole('combobox', { name: 'Ordenar por' }).click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
    } else {
      const sheet = await openFilterContainer(page, testInfo)
      await sheet.getByLabel('Ordenar por').click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
      await closeFilterSheetIfMobile(page, testInfo)
    }
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect(page).not.toHaveURL(/pagina=/)
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    // Volta à página 2 para testar mudança de aba.
    if (isDesktop) {
      await page.getByRole('link', { name: 'Página 2' }).click()
    } else {
      await page.getByRole('button', { name: 'Carregar mais' }).click()
    }
    await expect(page).toHaveURL(/pagina=2/)
    await page.evaluate('document.querySelector("#catalogo")?.scrollIntoView({ block: "start" })')
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    // 3) Mudar aba volta à página 1 e mantém o scroll no catálogo.
    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page).not.toHaveURL(/pagina=/)
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    // 4) "Limpar filtros" mantém aba, ordem e favoritos=1 e mantém o scroll no catálogo.
    await signInAs(page)
    await page.evaluate(
      `window.__kurio.router.navigate({ to: '/', search: { aba: 'em-alta', ordem: 'menor-preco', favoritos: 1, colecao: 'musica', rede: 'ethereum' }, resetScroll: false })`,
    )
    await expect(page).toHaveURL(/favoritos=1/)
    await expect(page).toHaveURL(/colecao=musica/)
    await expect(page).toHaveURL(/rede=ethereum/)

    await page.evaluate('document.querySelector("#catalogo")?.scrollIntoView({ block: "start" })')
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    const filterBox2 = await openFilterContainer(page, testInfo)
    await filterBox2.getByRole('button', { name: 'Limpar filtros' }).click()
    await closeFilterSheetIfMobile(page, testInfo)

    await expect(page).not.toHaveURL(/colecao=|rede=|precoMin=|precoMax=|q=/)
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect(page).toHaveURL(/favoritos=1/)
    if (isDesktop) {
      await expect.poll(scrollY).toBeGreaterThan(50)
    }
    await expect(page.locator('#catalogo')).toBeInViewport()

    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toEqual({
        page: '1',
        pageSize: '9',
        tab: 'trending',
        sort: 'price_asc',
        favorites: '1',
      })
  })

  test('3. contagens e facets do filtro coincidem com os totais do seed', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await expect(cards(page).first()).toBeVisible()

    const container = await openFilterContainer(page, testInfo)

    const collectionsGroup = container.getByRole('group', { name: 'Coleções' })
    for (const item of SEED_COLLECTIONS) {
      const btn = collectionsGroup.getByRole('button', {
        name: `${item.name}, ${item.count} NFTs`,
        exact: true,
      })
      await expect(btn).toBeVisible()
      await expect(btn).toContainText(`(${item.count})`)
    }

    const networksGroup = container.getByRole('group', { name: 'Rede' })
    for (const net of SEED_NETWORKS) {
      const btn = networksGroup.getByRole('button', {
        name: `${net.name}, ${net.count} NFTs`,
        exact: true,
      })
      await expect(btn).toBeVisible()
      await expect(btn).toContainText(`(${net.count})`)
    }
  })
})
