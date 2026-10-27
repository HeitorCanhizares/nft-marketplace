/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  openApp,
  ready,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

async function openCheckout(page: Page, activeScenarios?: string) {
  await openApp(page, activeScenarios)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

async function seriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

test.describe('Pagamento — acessibilidade da revisão, estados e breakpoint 1024 px (13-078)', () => {
  test('1. axe sem violações com revisão aberta e lista de mudanças; slow (skeleton), server-error e rede nos carregamentos', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    // 1a) Axe com a revisão aberta e com lista de mudanças (price-change-on-checkout)
    await openCheckout(page, 'price-change-on-checkout,payment-slow')
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // Dispara a mudança forçada para exibir QuoteChangeList dentro da revisão
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    await expect(
      review.getByRole('list', { name: 'Mudanças desde a última cotação' }),
    ).toBeVisible()

    // Radix Dialog aberto usa aria-hidden no resto do DOM (exclui aria-hidden-focus)
    expect(await seriousViolations(page, ['aria-hidden-focus'])).toEqual([])

    // 1b) Axe durante carregamento lento (skeleton)
    await page.goto('/')
    await ready(page)
    await openApp(page, 'slow')
    await page.goto('/pagamento')
    // Verifica que o skeleton do checkout está em tela e roda o axe
    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    // 1c) Axe no estado de erro de servidor (server-error em wallets)
    await page.goto('/')
    await ready(page)
    await openApp(page, 'server-error:GET /wallets')
    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    // 1d) Axe no estado de erro de rede (network-error em cart)
    await page.goto('/')
    await ready(page)
    await openApp(page, 'network-error:GET /cart')
    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('2. teclado, anúncios, breakpoint 1024 px, persistência no resize e contraste de muted-foreground sobre card', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'price-change-on-checkout,payment-slow')
    await collectAnnouncements(page)

    // 2a) Teclado
    if (testInfo.project.name === 'desktop') {
      // Ordem dos campos no desktop: Nome de exibição → Nome de usuário → Rede
      const nameInput = page.getByLabel('Nome de exibição')
      await nameInput.focus()
      await expect(nameInput).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Nome de usuário')).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(page.getByRole('combobox', { name: /^Rede/ })).toBeFocused()
    } else {
      // No mobile: foco na opção "⋮" da carteira salva abre menu e fecha com Escape
      const optionsBtn = page.getByRole('button', { name: /^Opções da carteira/ })
      await optionsBtn.focus()
      await expect(optionsBtn).toBeFocused()

      await page.keyboard.press('Enter')
      const editItem = page.getByRole('menuitem', { name: 'Editar carteira' })
      await expect(editItem).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(editItem).toHaveCount(0)
      await expect(optionsBtn).toBeFocused()
    }

    // 2b) Conecta MetaMask e confere anúncio de conexão
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()
    await expect
      .poll(async () => await announcements(page), { timeout: 10_000 })
      .toContain('Conectada: 0xA91F…E82C')

    // 2c) Revisão: foco inicial no "Voltar", foco preso e retorno ao fechar
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // Foco inicial padrão é o botão "Voltar"
    const backBtn = review.getByRole('button', { name: 'Voltar' })
    await expect(backBtn).toBeFocused()

    // Dispara mudança para testar anúncio de "Os valores mudaram" e "Processando..."
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()

    const currentAnnouncements = await announcements(page)
    expect(currentAnnouncements.some((a) => a.includes('Processando'))).toBe(true)
    expect(currentAnnouncements.some((a) => a.includes('Os valores mudaram'))).toBe(true)

    // Foco preso dentro do diálogo / folha ao navegar com Tab
    await page.keyboard.press('Tab')
    const activeTagName = await page.evaluate(
      `document.activeElement ? document.activeElement.tagName.toLowerCase() : null`,
    )
    expect(['button', 'input', 'a']).toContain(activeTagName)
    const isInsideDialog = await page.evaluate(
      `Boolean(document.activeElement?.closest('[role="dialog"]'))`,
    )
    expect(isInsideDialog).toBe(true)

    // Fechar pelo "Voltar" fecha a revisão
    await backBtn.click()
    await expect(review).toHaveCount(0)

    // 2d) Breakpoint 1024 px e transição desktop ↔ mobile mantendo estado
    // Abaixo de 1024 px (layout mobile): exibe barra superior com botão voltar
    await page.setViewportSize({ width: 1023, height: 800 })
    await expect(page.getByText('Pagamento com carteira').first()).toBeVisible()

    // A partir de 1024 px (layout desktop): exibe breadcrumb e formulário do colecionador
    await page.setViewportSize({ width: 1024, height: 800 })
    await expect(page.getByText('Perfil do colecionador')).toBeVisible()

    // Persistência: preenche observação no desktop, redimensiona para mobile e volta para desktop
    const noteArea = page.getByLabel('Observação do colecionador (opcional)')
    await noteArea.fill('Nota para teste de persistência no breakpoint')
    await page.setViewportSize({ width: 768, height: 800 })
    // Carteira MetaMask continua conectada no mobile
    await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()
    await page.setViewportSize({ width: 1439, height: 900 })
    // Observação preservada após voltar para desktop
    await expect(noteArea).toHaveValue('Nota para teste de persistência no breakpoint')

    // 2e) Contraste de muted-foreground sobre card
    const cardViolations = await new AxeBuilder({ page })
      .include('.bg-card')
      .withRules(['color-contrast'])
      .analyze()
    const seriousCardViolations = cardViolations.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(seriousCardViolations).toEqual([])
  })
})
