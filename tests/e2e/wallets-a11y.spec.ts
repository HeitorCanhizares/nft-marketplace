import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Axe em Carteiras (desktop e mobile, conforme o projeto). Estados ficam para a fase 13.
async function open(page: Page) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
}

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test('Carteiras com a secundária vazia sem violações graves de acessibilidade', async ({
  page,
}) => {
  await open(page)
  await expectNoSeriousViolations(page)
})

test('Carteiras com as duas carteiras sem violações graves e com nomes únicos', async ({
  page,
}) => {
  await open(page)
  const section = page.getByRole('region', { name: 'Carteira secundária' })
  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await section.getByLabel('Apelido da carteira').fill('Secundária')
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
  await expectNoSeriousViolations(page)

  for (const region of ['Carteira principal', 'Carteira secundária']) {
    const names = await page
      .getByRole('region', { name: region })
      .locator('input:not([type="hidden"]), button[role="combobox"]')
      .evaluateAll((els) =>
        els
          .map((e) => {
            const id = e.getAttribute('id')
            const label = id ? document.querySelector(`label[for="${id}"]`)?.textContent : null
            return (label ?? e.getAttribute('aria-label') ?? '').trim()
          })
          .filter((name) => name !== ''),
      )
    expect(new Set(names).size).toBe(names.length)
    expect(names).toContain('ENS ou carteira secundária')
  }
})
