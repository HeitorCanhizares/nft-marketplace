import { expect, test, type Page } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, ready, seedFigmaCart } from '../e2e/helpers.ts'

// Baseline do Pagamento, uma captura por viewport (desktop 1440 e mobile 414).
// Diferenças conhecidas para o Figma: formulário preenchido (o Figma está vazio) e a linha de
// estado da conexão. No mobile há a secundária "Reserva" cadastrada, como no Figma.
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

test('Pagamento', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  const isMobile = testInfo.project.name === 'mobile'
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

  if (isMobile) {
    await page.evaluate(`(async () => {
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      await window.__kurio.http.put('/wallets/secondary', {
        ...wallet,
        nickname: 'Reserva',
        network: 'polygon',
        ensName: 'nova-kurio.eth',
      })
    })()`)
  }

  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

  if (isMobile) await page.getByRole('radio', { name: 'Reserva' }).click()
  await page.getByRole('radio', { name: 'Coinbase Wallet' }).click()
  await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()
  if (!isMobile) await expect(page.locator('main img').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento.png', { ...SHOT, fullPage: true })
})
