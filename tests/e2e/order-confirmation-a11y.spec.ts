import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, seedOrder } from './helpers.ts'

// Axe no recibo e no estado pendente. Demais estados ficam para a fase 13 (12-020).
async function signIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

test('recibo sem violações graves, com foco e Esc no diálogo (desktop) ou página (mobile)', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await signIn(page)
  const orderId = await seedOrder(page, { status: 'confirmed' })
  await page.goto(`/pedido/${orderId}`)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])

  if (testInfo.project.name === 'desktop') {
    const dialog = page.getByRole('dialog', { name: 'Pedido confirmado' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { level: 1 })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
  } else {
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1, name: 'Pedido', exact: true })).toBeVisible()
    await expect(
      main.getByRole('heading', { level: 2, name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()
  }
})

test('pendente sem violações graves, anunciado como status', async ({ page }) => {
  test.setTimeout(60_000)
  await signIn(page)
  // Antes do pedido: senão ele confirmaria em 3 s no meio do axe.
  await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'payment-slow')`)
  const orderId = await seedOrder(page, { status: 'pending' })
  await page.goto(`/pedido/${orderId}`)
  await expect(
    page.getByRole('status').filter({ hasText: 'Confirmando pagamento...' }),
  ).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('ID da transação: botão de copiar nomeado e ID completo no texto acessível', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await signIn(page)
  const orderId = await seedOrder(page, { status: 'confirmed' })
  await page.goto(`/pedido/${orderId}`)
  await expect(page.getByRole('button', { name: 'Copiar ID da transação' })).toBeVisible()
  await expect(page.getByText(/^0x[0-9a-fA-F]{64}$/)).toHaveCount(1)
})
