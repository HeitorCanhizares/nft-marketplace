import { expect, test, type Page } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, ready } from '../e2e/helpers.ts'

// Baseline do perfil, uma captura por viewport (desktop 1440 e mobile 414).
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.mouse.move(0, 0)
}

async function open(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto(path)
  await ready(page)
}

test('Perfil dados', async ({ page }) => {
  await open(page, '/perfil/dados')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
  await settle(page)
  await expect(page).toHaveScreenshot('perfil-dados.png', { ...SHOT, fullPage: true })
})

test('Perfil menu (mobile)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile')
  await open(page, '/perfil')
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('perfil-menu.png', { ...SHOT, fullPage: true })
})
