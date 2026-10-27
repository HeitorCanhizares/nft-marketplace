/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  firstEditionId,
  only,
  openApp,
  ready,
  seedCart,
  seedFigmaCart,
} from './helpers.ts'

function summaryPanel(page: Page): Locator {
  // Filtra a seção visível do resumo do pedido (desktop ou mobile).
  return page.locator('section:visible', { hasText: 'Subtotal' })
}

async function assertNoSeriousA11y(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test.describe('Carrinho — acessibilidade dos estados, teclado e mobile 320 px (13-046)', () => {
  test('1a. Axe sem violações graves/críticas: aviso de preço, item esgotado, vazio e estado de erro', async ({
    page,
  }) => {
    await openApp(page)
    await seedFigmaCart(page)
    const violetEdition = await firstEditionId(page, 'violet-nomad-314')

    await page.goto('/carrinho')
    await ready(page)
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    await expect
      .poll(() => page.evaluate<boolean>('window.__kurio.socket.isSocketConnected()'))
      .toBe(true)

    // 1) Estado com aviso de preço e item esgotado simultaneamente.
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '1.49')
      await window.__kurioMock.triggerStockChange('violet-nomad-314', ${JSON.stringify(violetEdition)}, 0)
    })()`)
    await expect(page.getByText('Preço atualizado: 1.19 ETH → 1.49 ETH')).toBeVisible()
    await expect(page.getByText('Esgotado').first()).toBeVisible()
    await assertNoSeriousA11y(page)

    // 2) Estado vazio.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'empty-cart')`)
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await assertNoSeriousA11y(page)

    // 3) Estado de erro.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'server-error:GET /cart')`)
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible({
      timeout: 6_000,
    })
    await assertNoSeriousA11y(page)
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
  })

  test('1b. teclado (ordem lista -> resumo, Enter em Aplicar, lixeiras e steppers) e anúncios para leitor de tela (remoção, cupom e preço)', async ({
    page,
  }) => {
    await openApp(page)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
    ])
    await page.goto('/carrinho')
    await ready(page)
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    await expect
      .poll(() => page.evaluate<boolean>('window.__kurio.socket.isSocketConnected()'))
      .toBe(true)
    await collectAnnouncements(page)

    const apeGroup = page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ })
    const plus = apeGroup.getByRole('button', { name: 'Aumentar quantidade' })
    const minus = apeGroup.getByRole('button', { name: 'Diminuir quantidade' })
    const trash = page.getByRole('button', { name: /^Remover Emerald Ape #042/ })
    const panel = summaryPanel(page)
    const couponInput = panel.getByRole('textbox', { name: 'Código promocional' })

    // Stepper via teclado (Enter aumenta de 1 para 2; Enter no diminuir volta para 1).
    await plus.focus()
    await page.keyboard.press('Enter')
    await expect(apeGroup.getByRole('status')).toHaveText('2')

    // Ordem Tab: do botão "+" da última linha vai para a lixeira e em seguida entra no campo de cupom do resumo.
    await page.keyboard.press('Tab')
    await expect(trash).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(couponInput).toBeFocused()

    // Enter em "Aplicar" / campo de cupom aplica o código e anuncia para leitor de tela.
    await page.keyboard.type('KURIO10')
    await page.keyboard.press('Tab')
    await expect(panel.getByRole('button', { name: 'Aplicar' })).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible({ timeout: 10_000 })
    await expect.poll(async () => await announcements(page)).toContain('Cupom KURIO10 aplicado')

    // Stepper diminuir via teclado. Depois do cupom o foco vai para o campo do cupom, então
    // foco e Enter vão juntos no próprio botão (press), sem janela para o foco sair.
    await expect(panel.locator('[aria-busy="true"]')).toHaveCount(0)
    await minus.press('Enter')
    await expect(apeGroup.getByRole('status')).toHaveText('1')

    // Anúncio de mudança de preço em tempo real.
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '1.49')
    })()`)
    await expect
      .poll(async () => await announcements(page), { timeout: 5_000 })
      .toContain('O preço de Emerald Ape #042 mudou para 1,49 ETH')

    // Lixeira acionada por teclado (Enter) remove o item, anuncia a remoção e leva o foco ao título do estado vazio.
    await trash.focus()
    await page.keyboard.press('Enter')
    const emptyHeading = page.getByRole('heading', { name: 'Seu carrinho está vazio' })
    await expect(emptyHeading).toBeVisible()
    await expect(emptyHeading).toBeFocused()
    await expect
      .poll(async () => await announcements(page))
      .toContain('Emerald Ape #042 removido do carrinho')
  })

  test('2. [m] painel mobile com cupom, erro e resumo ao mesmo tempo em 320 px sem overflow horizontal', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await page.setViewportSize({ width: 320, height: 640 })

    await openApp(page)
    await seedFigmaCart(page)
    // Deixa Emerald Ape com estoque insuficiente (available = 1 para quantity = 2) para exibir também o motivo de bloqueio no painel.
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.editions = nft.editions.map((e) =>
          e.id === 'emerald-ape-042-1-50' ? { ...e, available: 1 } : e,
        )
        await nftsStore.put(nft)
      }
    })()`)

    await page.goto('/carrinho')
    await ready(page)

    const region = page.getByRole('region', { name: 'Resumo do pedido' })
    await expect(region).toBeVisible()

    // Provoca erro no campo de cupom para ter simultaneamente campo + erro + resumo de preços + motivo de bloqueio.
    await region.getByRole('textbox', { name: 'Código promocional' }).fill('INVALIDO')
    await region.getByRole('button', { name: 'Aplicar' }).click()
    await expect(region.getByText('Código promocional inválido.')).toBeVisible()
    await expect(region.getByText('Subtotal')).toBeVisible()
    await expect(
      region.getByText('Ajuste as quantidades acima do estoque para continuar.'),
    ).toBeVisible()

    const overflow = await page.evaluate<boolean>(
      `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
    )
    expect(overflow).toBe(false)

    const panelBox = await region.boundingBox()
    expect(panelBox).not.toBeNull()
    expect(panelBox?.x ?? -1).toBeGreaterThanOrEqual(0)
    expect((panelBox?.x ?? 0) + (panelBox?.width ?? 999)).toBeLessThanOrEqual(320)
  })
})
