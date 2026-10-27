import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Axe no perfil (desktop e mobile, conforme o projeto). Estados ficam para a fase 13.
async function open(page: Page, path: string) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto(path)
  await ready(page)
}

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test('Dados do perfil sem violações graves de acessibilidade', async ({ page }) => {
  await open(page, '/perfil/dados')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
  await expectNoSeriousViolations(page)
})

test('Menu do perfil (mobile) sem violações graves de acessibilidade', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile')
  await open(page, '/perfil')
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await expectNoSeriousViolations(page)
})

test('os campos de senha têm nomes acessíveis distintos', async ({ page }) => {
  await open(page, '/perfil/dados')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
  const names = await page
    .locator('input[type="password"]')
    .evaluateAll((els) =>
      els.map((e) => document.querySelector(`label[for="${e.id}"]`)?.textContent?.trim()),
    )
  expect(names).toHaveLength(3)
  expect(new Set(names).size).toBe(3)
})
