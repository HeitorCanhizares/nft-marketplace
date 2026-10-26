import { expect, test, type Page } from '@playwright/test'

import { ready } from '../e2e/helpers.ts'

// Baseline do detalhe do NFT, uma captura por viewport (desktop 1440 e mobile 414).
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    // Imagens fora da tela são preguiçosas: força o carregamento antes da captura inteira.
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

test('Detalhe do NFT', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/nft/emerald-ape-042')
  await ready(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.locator('main img').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('detalhes.png', { ...SHOT, fullPage: true })
})
