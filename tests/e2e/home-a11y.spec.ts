import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ready } from './helpers.ts'

// Axe na Início (desktop e mobile, conforme o projeto). Os demais estados ficam para a fase 13.
test('Início sem violações graves de acessibilidade', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible()
  await expect(page.locator('#catalogo').getByRole('heading', { level: 3 }).first()).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
})
