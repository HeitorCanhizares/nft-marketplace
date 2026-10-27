import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, seedFigmaCart, seedOrder } from './helpers.ts'

// Confirmação: só o caminho principal. Casos de borda ficam para a fase 13 (12-020).

function isDesktop(testInfo: TestInfo) {
  return testInfo.project.name === 'desktop'
}

async function signIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function orderTotal(page: Page, orderId: string) {
  return page.evaluate<string>(`(async () => {
    const res = await window.__kurio.http.get('/orders/${orderId}')
    return res.data.total
  })()`)
}

test('fluxo: pagar, pendente, confirmado, recibo e fechar', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  const desktop = isDesktop(testInfo)

  // Carrinho do Figma como visitante; o login mescla o carrinho.
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  if (desktop) await expect(page.getByLabel('Carrinho, 4 itens')).toBeVisible()

  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText('Conectada: 0xA91F…E82C')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/pedido\/[^/]+$/)
  const orderUrl = page.url()
  const orderId = orderUrl.slice(orderUrl.lastIndexOf('/') + 1)

  // Pendente: sem recibo.
  if (desktop) {
    await expect(page.getByRole('dialog', { name: 'Confirmando pagamento' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Confirmando pagamento', exact: true }),
    ).toBeFocused()
  } else {
    await expect(page.getByRole('heading', { name: 'Confirmando pagamento...' })).toBeVisible()
  }
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)

  // Confirmado, sem recarregar. No desktop é o mesmo diálogo, com o título novo.
  const scope = desktop
    ? page.getByRole('dialog', { name: 'Pedido confirmado' })
    : page.getByRole('main')
  if (desktop) {
    await expect(scope).toBeVisible({ timeout: 15_000 })
  } else {
    await expect(page.getByRole('heading', { level: 1, name: 'Pedido', exact: true })).toBeVisible()
  }
  await expect(scope.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
    timeout: 15_000,
  })
  await expect(scope.getByText('Emerald Ape #042')).toBeVisible()
  await expect(scope.getByText('(x 2)')).toBeVisible()
  await expect(scope.getByText('Taxa de rede')).toBeVisible()
  const total = await orderTotal(page, orderId)
  await expect(scope.getByText(`${total} ETH`, { exact: true }).first()).toBeVisible()
  await expect(scope.getByText(/^Transação confirmada na Ethereum\./)).toBeVisible()

  // Explorador simulado: abre em nova aba, mas o teste não sai do app.
  const explorer = scope.getByRole('link', { name: /Ver no Etherscan/ })
  await expect(explorer).toHaveAttribute('target', '_blank')
  await expect(explorer).toHaveAttribute('rel', /noopener/)
  await expect(explorer).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x[0-9a-fA-F]{64}$/)
  await expect(scope.getByText('Transação simulada')).toBeVisible()

  // Efeitos: carrinho esvaziado e checkout guardado apagado.
  const itemCount = await page.evaluate<number>(`(async () => {
    const res = await window.__kurio.http.get('/cart')
    return res.data.itemCount
  })()`)
  expect(itemCount).toBe(0)
  const stored = await page.evaluate<(string | null)[]>(
    `[sessionStorage.getItem('kurio:checkout'), sessionStorage.getItem('kurio:checkout-draft')]`,
  )
  expect(stored).toEqual([null, null])
  if (desktop) await expect(page.getByLabel(/^Carrinho, \d+ itens?$/)).toHaveCount(0)

  // Fechar leva à Início; o recibo continua acessível pela URL.
  if (desktop) {
    await page.keyboard.press('Escape')
  } else {
    await page.getByRole('link', { name: 'Voltar' }).click()
  }
  await expect(page).toHaveURL(/\/$/)

  await page.goto(orderUrl)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
})

test('rede do pedido: Polygon', async ({ page }) => {
  test.setTimeout(60_000)
  await signIn(page)
  const orderId = await seedOrder(page, { status: 'confirmed', network: 'polygon' })

  await page.goto(`/pedido/${orderId}`)
  await expect(page.getByText(/^Transação confirmada na Polygon\./)).toBeVisible()
  const explorer = page.getByRole('link', { name: /Ver no Polygonscan/ })
  await expect(explorer).toBeVisible()
  await expect(explorer).toHaveAttribute('href', /^https:\/\/polygonscan\.com\/tx\//)
})
