import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Detalhes do NFT: só o caminho principal. Casos de borda ficam para a fase 13 (07-018).

const PATH = '/nft/emerald-ape-042'
const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function go(page: Page, path = PATH) {
  await page.goto(path)
  await ready(page)
}

async function signIn(page: Page) {
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

test('acesso direto mostra título, preço, token, coleção e atributos', async ({
  page,
}, testInfo) => {
  await go(page)
  await expect(page).toHaveTitle(/Emerald Ape #042/)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText('1.19 ETH').first()).toBeVisible()
  await expect(page.getByText('#0042').first()).toBeVisible()
  await expect(page.getByText('Arte digital').first()).toBeVisible()
  await expect(page.getByText('Óculos, Esmeralda, Raro').first()).toBeVisible()
  if (isDesktop(testInfo)) {
    await expect(
      page.getByRole('navigation', { name: 'Navegação estrutural' }).getByText('Emerald Ape #042'),
    ).toHaveAttribute('aria-current', 'page')
  }
})

test('trocar a edição atualiza o preço e o stepper funciona', async ({ page }) => {
  await go(page)
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.locator('output[aria-label="Quantidade"]').first()).toHaveText('2')
  await page.getByRole('radio', { name: '1/10' }).click()
  await expect(page.getByText('1.39 ETH').first()).toBeVisible()
  await expect(page.locator('output[aria-label="Quantidade"]').first()).toHaveText('1')
})

test('galeria troca a imagem e o zoom abre e fecha', async ({ page }, testInfo) => {
  await go(page)
  if (isDesktop(testInfo)) {
    const main = page.locator('main img').nth(4)
    const before = await main.getAttribute('src')
    await page.getByRole('button', { name: 'Imagem 2 de 4' }).click()
    await expect(main).not.toHaveAttribute('src', before ?? '')
    await page.getByRole('button', { name: 'Ampliar imagem' }).click()
  } else {
    await page.getByRole('button', { name: 'Ampliar imagem 1 de 4' }).click()
  }
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('desktop: COMPRAR adiciona ao carrinho e vai a /carrinho', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  await go(page)
  await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' }).first()).toBeAttached()
})

test('mobile: o botão de carrinho adiciona e fica na página', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  await go(page)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByRole('button', { name: 'Adicionado ao carrinho' })).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${PATH}$`))
})

test('favorita logado e persiste após recarregar', async ({ page }) => {
  await go(page)
  await signIn(page)
  const favorite = () => page.getByRole('button', { name: /Favoritar/ }).first()
  // O usuário de teste já tem o Emerald Ape nos favoritos do seed: remove e favorita de novo.
  await expect(favorite()).toHaveAttribute('aria-pressed', 'true')
  await favorite().click()
  await expect(favorite()).toHaveAttribute('aria-pressed', 'false')
  await expect(favorite()).not.toHaveAttribute('aria-busy', 'true')
  await favorite().click()
  await expect(favorite()).toHaveAttribute('aria-pressed', 'true')
  await expect(favorite()).not.toHaveAttribute('aria-busy', 'true')
  await page.reload()
  await ready(page)
  await expect(favorite()).toHaveAttribute('aria-pressed', 'true')
})

test('avaliações: aba com Carregar mais (desktop) ou Sheet (mobile)', async ({
  page,
}, testInfo) => {
  await go(page)
  await page.getByRole('button', { name: /Ver 19 avaliações/ }).click()
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('tab', { name: /^Avaliações/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const items = page.getByRole('tabpanel').getByRole('listitem')
    await expect(items).toHaveCount(5)
    await page.getByRole('button', { name: 'Carregar mais' }).click()
    await expect(items).toHaveCount(10)
  } else {
    await expect(page.getByRole('dialog', { name: /Avaliações de colecionadores/ })).toBeVisible()
  }
})

test('desktop: coleção relacionada e links de compartilhar', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  await go(page)
  await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Compartilhar no LinkedIn/ })).toHaveAttribute(
    'href',
    /linkedin\.com\/sharing\/share-offsite\/\?url=/,
  )
  await expect(page.getByRole('link', { name: /Compartilhar no Twitter/ })).toHaveAttribute(
    'href',
    /twitter\.com\/intent\/tweet\?url=/,
  )
  await expect(page.getByRole('link', { name: 'Compartilhar por e-mail' })).toHaveAttribute(
    'href',
    /^mailto:\?subject=/,
  )
})

test('NFT inexistente mostra "NFT não encontrado"', async ({ page }) => {
  await go(page, '/nft/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver o catálogo' })).toBeVisible()
})
