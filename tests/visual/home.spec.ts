import { expect, test, type Page } from '@playwright/test'

import { ready } from '../e2e/helpers.ts'

// Baseline da Início, uma captura por viewport (desktop 1440 e mobile 414). Movimento reduzido
// deixa o hero parado no primeiro slide, o que torna a captura determinística.
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

test('Início', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible()
  await expect(page.locator('#catalogo').getByRole('heading', { level: 3 }).first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('inicio.png', { ...SHOT, fullPage: true })
})
