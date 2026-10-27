import { expect, test, type Page } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, ready, seedOrder } from '../e2e/helpers.ts'

// Baseline da Confirmação (recibo), uma captura por viewport. O recibo do Figma é desktop 1440 × 1657.
// Diferenças conhecidas para o Figma: data em pt-BR ("29 de jul. de 2026"), rótulos da faixa todos em
// negrito, legenda "Transação simulada" abaixo do botão, botão de copiar ao lado do ID, edição abaixo
// do ID do token e o fundo sem o Pagamento por trás. O mobile é adaptado (não existe no Figma).
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

test('Confirmação', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  const isMobile = testInfo.project.name === 'mobile'
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // O modal fica a 166 px do topo, como no Figma, com a altura da tela do desenho.
  if (!isMobile) await page.setViewportSize({ width: 1440, height: 1657 })
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  const orderId = await seedOrder(page, { status: 'confirmed' })

  await page.goto(`/pedido/${orderId}`)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('confirmacao.png', { ...SHOT, fullPage: isMobile })
})
