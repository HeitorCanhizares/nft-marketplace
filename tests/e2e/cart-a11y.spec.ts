import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { ready, seedCart } from './helpers.ts'

// Axe no carrinho (desktop e mobile, conforme o projeto). Estados ficam para a fase 13.
async function openCartWithTwoItems(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedCart(page, [
    { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
    { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-10', quantity: 1 },
  ])
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.locator('button[data-remove-for]:visible')).toHaveCount(2)
}

test('Carrinho sem violações graves de acessibilidade', async ({ page }) => {
  await openCartWithTwoItems(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
})

test('as lixeiras têm nomes únicos', async ({ page }) => {
  await openCartWithTwoItems(page)
  const names = await page
    .locator('button[data-remove-for]:visible')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
  expect(new Set(names).size).toBe(names.length)
})
