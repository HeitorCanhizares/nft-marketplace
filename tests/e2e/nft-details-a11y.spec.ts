import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { ready } from './helpers.ts'

// Axe no detalhe do NFT (desktop e mobile, conforme o projeto). Estados ficam para a fase 13.
test('Detalhe do NFT sem violações graves de acessibilidade', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await ready(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
})
