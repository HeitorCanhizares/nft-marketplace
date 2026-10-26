import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, seedCart } from './helpers.ts'

// Carrinho: só o caminho principal. Casos de borda ficam para a fase 13 (08-015).

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function openCart(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedCart(page, [
    { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
  ])
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042' })).toBeVisible()
}

const panelOf = (page: Page) => page.locator('section:visible', { hasText: 'Subtotal' })
const quantity = (page: Page) =>
  page.locator('output[aria-label^="Quantidade de Emerald Ape #042"]:visible')

test('lista e resumo mostram a linha, o subtotal, a taxa e o total', async ({ page }, testInfo) => {
  await openCart(page)
  await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  await expect(page.getByText('1.19 ETH').first()).toBeVisible()
  if (isDesktop(testInfo)) {
    await expect(page.getByText('#0042')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Resumo do pedido' })).toBeVisible()
  }
  const panel = panelOf(page)
  await expect(panel.getByText('Subtotal').locator('..')).toContainText('1.19 ETH')
  await expect(panel.getByText('Taxa de rede').locator('..')).toContainText('0.016 ETH')
  await expect(panel.getByText('Taxa estimada')).toBeVisible()
  await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('1.206 ETH')
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeAttached()
  }
})

test('quantidade atualiza o resumo e persiste ao recarregar', async ({ page }) => {
  await openCart(page)
  const panel = panelOf(page)
  await page.getByRole('button', { name: 'Aumentar quantidade' }).first().click()
  await expect(quantity(page)).toHaveText('2')
  await expect(panel.getByText('Subtotal').locator('..')).toContainText('2.38 ETH')
  await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('2.396 ETH')

  await page.reload()
  await ready(page)
  await expect(quantity(page)).toHaveText('2')

  const minus = page.getByRole('button', { name: 'Diminuir quantidade' }).first()
  await minus.click()
  await expect(quantity(page)).toHaveText('1')
  await expect(minus).toBeDisabled()
})

test('aplicar e remover o cupom KURIO10', async ({ page }) => {
  await openCart(page)
  const panel = panelOf(page)
  await panel.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
  await panel.getByRole('button', { name: 'Aplicar' }).click()
  await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()
  await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText('0.119 ETH')

  await panel.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
  await expect(panel.getByRole('textbox', { name: 'Código promocional' })).toBeVisible()
  await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText('0.00')
})

test('remover mostra Desfazer, o item volta e o carrinho esvazia', async ({ page }) => {
  await openCart(page)
  const trash = page.getByRole('button', { name: 'Remover Emerald Ape #042' })
  await trash.click()
  const toast = page.locator('[data-sonner-toast]', { hasText: 'Emerald Ape #042 removido' })
  await expect(toast).toBeVisible()
  await toast.getByRole('button', { name: 'Desfazer' }).click()
  await expect(trash).toBeVisible()

  await trash.click()
  const empty = page.getByRole('heading', { name: 'Seu carrinho está vazio' })
  await expect(empty).toBeVisible()
  await expect(empty).toBeFocused()
  await expect(page.getByRole('link', { name: 'Explorar NFTs' })).toBeVisible()
})

test('visitante vai ao login ao finalizar', async ({ page }) => {
  await openCart(page)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/entrar/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/pagamento')
})

test('usuário logado vai ao pagamento ao finalizar', async ({ page }) => {
  await openCart(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042' })).toBeVisible()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/pagamento/)
})

test('desktop: recomendações e Continuar explorando', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  await openCart(page)
  await expect(page.getByText('Colecionadores também viram')).toBeVisible()
  await page.getByRole('link', { name: 'Continuar explorando' }).click()
  await expect(page).toHaveURL(/localhost:4173\/(#.*)?$/)
})

test('mobile: sem carrossel e com painel inferior', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  await openCart(page)
  await expect(page.getByText('Colecionadores também viram')).toHaveCount(0)
  const panel = page.getByRole('region', { name: 'Resumo do pedido' })
  await expect(panel.getByRole('textbox', { name: 'Código promocional' })).toBeVisible()
  await expect(panel.getByText('Subtotal')).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Conectar e finalizar' })).toBeVisible()
})
