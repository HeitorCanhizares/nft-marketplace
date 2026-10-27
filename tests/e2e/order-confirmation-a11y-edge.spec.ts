import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  OTHER_USER,
  ready,
  scenarios,
  seedOrder,
  signInAs,
} from './helpers.ts'

async function setupSignedIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await signInAs(page, 'primary')
}

async function seriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

test.describe('13-085: Confirmação — acessibilidade (esqueleto, responsividade, reduced-motion, teclado, leitor e axe)', () => {
  test('1. esqueleto com slow, transição desktop e mobile mantém estado e larguras de 1024 a 1439 px sem estouro horizontal', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // 1a. Esqueleto com slow na consulta do pedido
    const orderId = await seedOrder(page, { status: 'confirmed' })
    await scenarios(page, 'slow')
    await page.goto(`/pedido/${orderId}`)

    // Esqueleto visível durante o carregamento lento
    const skeleton = page.getByText('Carregando pedido…')
    await expect(skeleton).toBeVisible()

    // Ao terminar de carregar, o esqueleto dá lugar ao recibo
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)

    // 1b. Transição [d] <-> [m] no meio do acompanhamento mantém o estado pendente
    await scenarios(page, 'payment-slow')
    const pendingOrderId = await seedOrder(page, { status: 'pending' })
    await page.goto(`/pedido/${pendingOrderId}`)
    await ready(page)

    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()

    // Alterna para viewport mobile
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Pedido' })).toBeVisible()

    // Retorna para viewport desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      const dialog = page.getByRole('dialog', { name: 'Confirmando pagamento' })
      await expect(dialog).toBeVisible()
    }

    // 1c. Larguras intermediárias de 1024 a 1439 px sem transbordamento horizontal
    const confirmedOrderId = await seedOrder(page, { status: 'confirmed' })
    await page.goto(`/pedido/${confirmedOrderId}`)
    await ready(page)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    for (const width of [1024, 1200, 1439]) {
      await page.setViewportSize({ width, height: 800 })
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })

  test('2. prefers-reduced-motion desativa animação do spinner e teclado (foco no título, preso, X e Esc fecham)', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // 2a. prefers-reduced-motion: spinner sem rotação contínua
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await scenarios(page, 'payment-slow')
    const pendingOrderId = await seedOrder(page, { status: 'pending' })
    await page.goto(`/pedido/${pendingOrderId}`)
    await ready(page)

    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()
    // O spinner no código tem classe motion-reduce:animate-none
    const spinner = page.locator('svg.motion-reduce\\:animate-none')
    await expect(spinner).toBeVisible()

    // 2b. Teclado no diálogo desktop (Escape, X e foco no título)
    if (testInfo.project.name === 'desktop') {
      const confirmedOrderId = await seedOrder(page, { status: 'confirmed' })
      await page.goto(`/pedido/${confirmedOrderId}`)
      await ready(page)

      const dialog = page.getByRole('dialog', { name: 'Pedido confirmado' })
      await expect(dialog).toBeVisible()

      // Título h1 recebe foco inicial automaticamente
      const heading = dialog.getByRole('heading', { level: 1 })
      await expect(heading).toBeFocused()

      // O foco permanece preso no diálogo durante a navegação por Tab
      for (let i = 0; i < 6; i += 1) {
        await page.keyboard.press('Tab')
        const isInside = await dialog.evaluate((el) => el.contains(document.activeElement))
        expect(isInside).toBe(true)
      }

      // Tecla Escape fecha o diálogo e retorna para /
      await page.keyboard.press('Escape')
      await expect(page).toHaveURL(/\/$/)

      // Botão Fechar (X) também fecha o diálogo
      await page.goto(`/pedido/${confirmedOrderId}`)
      await ready(page)
      await expect(dialog).toBeVisible()
      const closeBtn = page.getByRole('button', { name: 'Fechar' })
      await expect(closeBtn).toBeVisible()
      await closeBtn.click()
      await expect(page).toHaveURL(/\/$/)
    }
  })

  test('3. leitor de tela (anúncios live, ID completo acessível) e contraste sobre card', async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await setupSignedIn(page)

    // 3a. ID completo em elemento com classe sr-only para leitor de tela
    const orderId = await seedOrder(page, { status: 'confirmed' })
    await page.goto(`/pedido/${orderId}`)
    await ready(page)
    await collectAnnouncements(page)

    await expect(page.getByRole('button', { name: 'Copiar ID da transação' })).toBeVisible()
    await expect(page.getByText(/^0x[0-9a-fA-F]{64}$/)).toHaveCount(1)

    // 3b. Clique no botão de copiar emite anúncio polite
    await page.getByRole('button', { name: 'Copiar ID da transação' }).click()
    await expect.poll(async () => announcements(page)).toContain('ID da transação copiado')

    // 3c. Contraste de texto sobre card (não há violações graves no recibo)
    expect(await seriousViolations(page)).toEqual([])
  })

  test('4. auditoria de acessibilidade (axe) nos estados pendente, recusado, 403 e 404', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // 4a. Estado pendente
    await scenarios(page, 'payment-slow')
    const pendingId = await seedOrder(page, { status: 'pending' })
    await page.goto(`/pedido/${pendingId}`)
    await ready(page)
    await expect(
      page.getByRole('status').filter({ hasText: 'Confirmando pagamento...' }),
    ).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    // 4b. Estado recusado
    const declinedId = await seedOrder(page, {
      status: 'declined',
      declineReason: 'Saldo insuficiente na carteira conectada.',
    })
    await page.goto(`/pedido/${declinedId}`)
    await ready(page)
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento recusado' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    // 4c. Estado 403 (outro usuário)
    const otherOrderId = await seedOrder(page, {
      status: 'confirmed',
      userId: OTHER_USER.id,
    })
    await page.goto(`/pedido/${otherOrderId}`)
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    // 4d. Estado 404 (inexistente)
    await page.goto('/pedido/ordem-inexistente-axe-check')
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Pedido não encontrado' }),
    ).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })
})
