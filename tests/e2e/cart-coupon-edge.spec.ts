import { expect, test, type Locator, type Page } from '@playwright/test'

import { only, openApp, ready, recordApi, seedFigmaCart, signInAs } from './helpers.ts'

function summaryPanel(page: Page): Locator {
  // Filtra a seção visível do resumo do pedido (desktop ou mobile).
  return page.locator('section:visible', { hasText: 'Subtotal' })
}

async function openFigmaCart(page: Page) {
  await openApp(page)
  await seedFigmaCart(page)
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
}

type QuoteSnapshot = {
  subtotal: string
  discount: string
  networkFee: string
  total: string
  expectedDiscount: string
  couponStatus: string | null
}

async function quoteSnapshot(page: Page, percent: number): Promise<QuoteSnapshot> {
  return page.evaluate<QuoteSnapshot>(`(async () => {
    const quote = (await window.__kurio.http.post('/quote', {})).data
    const { ethToUnits, unitsToEth } = window.__kurioMock.money
    const subtotalUnits = ethToUnits(quote.subtotal)
    const expectedDiscount = unitsToEth(Math.floor((subtotalUnits * ${percent}) / 100))
    return {
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      expectedDiscount,
      couponStatus: quote.coupon ? quote.coupon.status : null,
    }
  })()`)
}

test.describe('Carrinho — cupons (13-042)', () => {
  test('1. COUPON_INVALID e COUPON_EXPIRED (EXPIRADO): mensagem ligada via aria-describedby, foco no campo e valores sem desconto', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const panel = summaryPanel(page)
    const input = panel.getByRole('textbox', { name: 'Código promocional' })
    const apply = panel.getByRole('button', { name: 'Aplicar' })

    // 1) Código desconhecido -> COUPON_INVALID.
    await input.fill('DESCONHECIDO99')
    await apply.click()

    await expect(panel.getByText('Código promocional inválido.')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toBeFocused()
    const invalidId = await input.getAttribute('aria-describedby')
    expect(invalidId).toBeTruthy()
    await expect(page.locator(`[id="${invalidId ?? ''}"]`)).toHaveText(
      'Código promocional inválido.',
    )
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.00 ETH',
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.576 ETH')

    // 2) Código expirado (EXPIRADO) -> COUPON_EXPIRED.
    await input.fill('EXPIRADO')
    await apply.click()

    await expect(panel.getByText('Este código promocional expirou.')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toBeFocused()
    const expiredId = await input.getAttribute('aria-describedby')
    expect(expiredId).toBeTruthy()
    await expect(page.locator(`[id="${expiredId ?? ''}"]`)).toHaveText(
      'Este código promocional expirou.',
    )
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.00 ETH',
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.576 ETH')
  })

  test('2. GENESIS5 (5 %) e KURIO10 (10 %): desconto floor(subtotal * % / 100) em unidades de 0,000001 ETH igual à cotação e código normalizado', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const panel = summaryPanel(page)

    // GENESIS5 (5 % de 5.56 ETH = 0.278 ETH).
    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('GENESIS5')
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Cupom GENESIS5 aplicado')).toBeVisible()

    const genesisQuote = await quoteSnapshot(page, 5)
    expect(genesisQuote.discount).toBe(genesisQuote.expectedDiscount)
    expect(genesisQuote.discount).toBe('0.278')
    await expect(panel.getByText('Subtotal').locator('..')).toContainText(
      `${genesisQuote.subtotal} ETH`,
    )
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      `(-) ${genesisQuote.discount} ETH`,
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText(
      `${genesisQuote.total} ETH`,
    )

    // Remove GENESIS5 e aplica "  kurio10 " com espaços e minúsculas -> normaliza para KURIO10 (10 % = 0.556 ETH).
    await panel.getByRole('button', { name: 'Remover cupom GENESIS5' }).click()
    await expect(panel.getByRole('textbox', { name: 'Código promocional' })).toBeVisible()

    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('  kurio10 ')
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()

    const kurioQuote = await quoteSnapshot(page, 10)
    expect(kurioQuote.discount).toBe(kurioQuote.expectedDiscount)
    expect(kurioQuote.discount).toBe('0.556')
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      `(-) ${kurioQuote.discount} ETH`,
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText(
      `${kurioQuote.total} ETH`,
    )
  })

  test('3. campo vazio só valida no envio; "Remover cupom" volta ao total sem desconto; cupom persiste a refresh e segue ao login', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const api = recordApi(page)
    const panel = summaryPanel(page)
    const input = panel.getByRole('textbox', { name: 'Código promocional' })

    // Sair do campo vazio (blur) não dispara erro.
    await input.focus()
    await panel.getByRole('button', { name: 'Conectar e finalizar' }).focus()
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(panel.getByText('Informe o código promocional.')).toHaveCount(0)

    // Enviar vazio mostra a mensagem de validação sem requisição à API.
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Informe o código promocional.')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(api.calls('PUT', '/cart/coupon')).toHaveLength(0)

    // Aplica KURIO10 e confere persistência após refresh.
    await input.fill('KURIO10')
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.02 ETH')

    await page.reload()
    await ready(page)
    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.556 ETH',
    )

    // "Remover cupom" volta ao total sem desconto.
    await panel.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expect(panel.getByRole('textbox', { name: 'Código promocional' })).toBeVisible()
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.00 ETH',
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.576 ETH')

    // Aplica GENESIS5 como visitante e faz login: o cupom do visitante prevalece porque o usuário não tinha cupom.
    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('GENESIS5')
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Cupom GENESIS5 aplicado')).toBeVisible()

    // Faz login enviando X-Cart-Id para acionar mergeGuestCart no backend simulado.
    await signInAs(page, 'primary')
    await expect(panel.getByText('Cupom GENESIS5 aplicado')).toBeVisible()
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.278 ETH',
    )
  })

  test('4. cupom que venceu depois de aplicado: cotação traz coupon.status = expired, sem desconto e aviso no painel', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const panel = summaryPanel(page)

    // Aplica um cupom válido e depois simula no banco que o código gravado no carrinho expirou.
    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
    await panel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()

    await page.evaluate(`(async () => {
      const cartId = localStorage.getItem('kurio:guest-cart-id')
      if (!cartId) return
      const { cartsStore } = window.__kurioMock.stores
      const record = await cartsStore.get(cartId)
      if (!record) return
      await cartsStore.put({ ...record, coupon: { code: 'EXPIRADO' }, version: record.version + 1 })
      await window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })
      await window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.quoteAll })
    })()`)

    await expect(panel.getByText('Este código promocional expirou.')).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Remover cupom EXPIRADO' })).toBeVisible()
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.00 ETH',
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.576 ETH')

    const snapshot = await quoteSnapshot(page, 10)
    expect(snapshot.couponStatus).toBe('expired')
    expect(snapshot.discount).toBe('0.00')
  })

  test('5. [m] painel inferior fixo com campo de cupom embutido', async ({ page }, testInfo) => {
    only(testInfo, 'mobile')
    await openFigmaCart(page)

    const region = page.getByRole('region', { name: 'Resumo do pedido' })
    await expect(region).toBeVisible()
    const input = region.getByRole('textbox', { name: 'Código promocional' })
    await expect(input).toBeVisible()

    await input.fill('KURIO10')
    await region.getByRole('button', { name: 'Aplicar' }).click()
    await expect(region.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    await expect(region.getByText('Desconto do lançamento').locator('..')).toContainText(
      '(-) 0.556 ETH',
    )
  })
})
