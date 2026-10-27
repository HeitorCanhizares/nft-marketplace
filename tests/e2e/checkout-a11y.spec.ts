import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, seedFigmaCart } from './helpers.ts'

// Axe no Pagamento (desktop e mobile, conforme o projeto). Estados ficam para a fase 13.
async function openCheckout(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

test('Pagamento sem violações graves de acessibilidade', async ({ page }) => {
  test.setTimeout(60_000)
  await openCheckout(page)
  expect(await seriousViolations(page)).toEqual([])
})

test('revisão aberta sem violações graves de acessibilidade', async ({ page }) => {
  test.setTimeout(60_000)
  await openCheckout(page)
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toBeVisible()
  expect(await seriousViolations(page)).toEqual([])
})

test('rádios e botões têm nomes acessíveis únicos', async ({ page }) => {
  test.setTimeout(60_000)
  await openCheckout(page)
  for (const role of ['radio', 'button'] as const) {
    const names = await page
      .locator('#conteudo')
      .getByRole(role)
      .evaluateAll((els) =>
        els.map((e) => {
          const byId = (e.getAttribute('aria-labelledby') ?? '')
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent ?? '')
            .join(' ')
            .trim()
          const label = Array.from((e as HTMLInputElement).labels ?? [])
            .map((l) => l.textContent ?? '')
            .join(' ')
          return e.getAttribute('aria-label') ?? (byId || label || e.textContent?.trim() || '')
        }),
      )
    expect(new Set(names).size).toBe(names.length)
  }
})
