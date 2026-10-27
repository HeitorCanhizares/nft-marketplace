// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Início: só o caminho principal. Casos de borda (estados, tempo real, cliques repetidos, hero
// com relógio) ficam para a fase 13 (ver docs/blocos/06-059-test-bridge.md).

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function go(page: Page, path = '/') {
  await page.goto(path)
  await ready(page)
}

async function signIn(page: Page) {
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

// Os cards são os itens da lista com título (h3); a paginação também usa listitem.
const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

test('abre a Início com hero, destaque, catálogo, promos e blog', async ({ page }, testInfo) => {
  await go(page)
  const hero = page.getByRole('region', { name: 'Destaques' })
  await expect(hero).toBeVisible()
  await expect(hero.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(hero.getByRole('button', { name: 'EXPLORAR' })).toBeVisible()

  await expect(
    page.locator('#catalogo').getByRole('heading', { name: 'Catálogo de NFTs' }),
  ).toBeAttached()
  await expect(page.getByRole('tab', { name: 'Todos os NFTs' })).toBeVisible()
  await expect(cards(page)).toHaveCount(9)

  // Promos, blog e destaque existem só no desktop.
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('heading', { name: 'Diário da Cunhagem' })).toBeVisible()
    await expect(page.getByRole('article').filter({ hasText: 'Leitura de' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /NFT EM DESTAQUE/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /^[^:]+: .+/ }).first()).toBeVisible()
  }
})

test.describe('filtros, ordenação e paginação (desktop)', () => {
  test('coleção, rede, ordenação e página atualizam a URL', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)

    const scrollY = () => page.evaluate<number>('window.scrollY')

    const collection = page.getByRole('button', { name: /NFTs$/ }).first()
    await collection.click()
    await expect(page).toHaveURL(/colecao=/)
    await expect(cards(page).first()).toBeVisible()
    await expect.poll(scrollY).toBeGreaterThan(200)

    await page.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
    await expect(page).toHaveURL(/rede=ethereum/)
    await expect.poll(scrollY).toBeGreaterThan(200)

    await page.getByRole('combobox', { name: 'Ordenar por' }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect.poll(scrollY).toBeGreaterThan(200)

    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/colecao=|rede=/)
    await expect.poll(scrollY).toBeGreaterThan(200)

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/pagina=2/)
    await expect(cards(page).first()).toBeVisible()
    await expect.poll(scrollY).toBeGreaterThan(200)
    await expect.poll(scrollY).toBeLessThan(900)
  })

  test('abre uma aba', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/aba=em-alta/)
    await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('busca pelo cabeçalho', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await page.getByRole('banner').getByRole('button', { name: 'Abrir busca' }).click()
    await page.getByRole('textbox', { name: 'Buscar NFTs e coleções' }).fill('cosmic')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=cosmic/)
    await expect(cards(page).first()).toBeVisible()
  })
})

test.describe('mobile', () => {
  test('busca pela barra, "Carregar mais" e drawer de filtros', async ({ page }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page)

    await expect(cards(page)).toHaveCount(9)
    await page.getByRole('button', { name: 'Carregar mais' }).click()
    await expect(cards(page)).toHaveCount(18)

    await page.getByRole('button', { name: 'Filtros' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await sheet.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
    await sheet.getByRole('button', { name: /^Ver / }).click()
    await expect(page).toHaveURL(/rede=ethereum/)

    const bar = page.getByRole('searchbox', { name: 'Buscar NFTs e coleções' })
    await bar.fill('cosmic')
    await expect(page).toHaveURL(/q=cosmic/)
  })

  test('abre uma aba', async ({ page }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page)
    await page.getByRole('tab', { name: 'Novos lançamentos' }).click()
    await expect(page).toHaveURL(/aba=novos/)
  })
})

test('favorita logado e adiciona ao carrinho pelo card', async ({ page }, testInfo) => {
  await go(page)
  await signIn(page)
  const card = cards(page).first()
  const name = (await card.getByRole('heading', { level: 3 }).innerText()).trim()

  await card.getByRole('button', { name: `Favoritar ${name}` }).click({ force: true })
  await expect(card.getByRole('button', { name: `Favoritar ${name}` })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // No mobile o card não tem a ação de carrinho (ela existe só no hover/foco do desktop).
  if (!isDesktop(testInfo)) return
  await card.getByRole('button', { name: `Adicionar ${name} ao carrinho` }).click({ force: true })
  await expect(page.getByRole('link', { name: /^Carrinho, 1 item$/ }).first()).toBeAttached()
})

test('clicar no card abre o detalhe do NFT', async ({ page }) => {
  await go(page)
  const link = cards(page).first().getByRole('link').first()
  const href = await link.getAttribute('href')
  await link.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  expect(href).toMatch(/^\/nft\//)
})
