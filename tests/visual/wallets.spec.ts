import { expect, test } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, ready } from '../e2e/helpers.ts'

// Baseline de Carteiras, uma captura por viewport (desktop 1440 e mobile 414).
// Estado do Figma: formulário da principal sem carteira e secundária vazia.
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

test('Carteiras', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.other)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição').first()).toHaveValue('Outro Kurio')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.mouse.move(0, 0)
  await expect(page).toHaveScreenshot('carteiras.png', { ...SHOT, fullPage: true })
})
