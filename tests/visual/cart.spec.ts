import { expect, test, type Page } from '@playwright/test'

import { ready, seedFigmaCart } from '../e2e/helpers.ts'

// Baseline do carrinho, uma captura por viewport (desktop 1440 e mobile 414).
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'))
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            }),
      ),
    )
  })
  await page.mouse.move(0, 0)
}

test('Carrinho', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Remover Ivory Baron #088' })).toBeVisible()
  await expect(page.locator('main img').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('carrinho.png', { ...SHOT, fullPage: true })
})
