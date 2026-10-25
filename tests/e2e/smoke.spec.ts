import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 414, height: 896 },
} as const

test('a página inicial carrega', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Kurio' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page).toHaveTitle('Kurio')
})

test('o projeto tem o viewport esperado', async ({ page }, testInfo) => {
  const name = testInfo.project.name as keyof typeof viewports

  expect(page.viewportSize()).toEqual(viewports[name])
})

test('sem violações graves de acessibilidade', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Kurio' })).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')

  expect(serious).toEqual([])
})
