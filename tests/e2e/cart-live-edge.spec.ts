import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  firstEditionId,
  openApp,
  ready,
  recordApi,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

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
  await expect
    .poll(() => page.evaluate<boolean>('window.__kurio.socket.isSocketConnected()'))
    .toBe(true)
}

test.describe('Carrinho — tempo real: price_changed, stock_changed e reconexão (13-044)', () => {
  test('1. triggerPriceChange: aviso de preço atualizado na linha, cotação refeita, anúncio polite agrupado, foco intacto e aviso some ao agir na linha', async ({
    page,
  }) => {
    await openFigmaCart(page)
    await collectAnnouncements(page)

    const panel = summaryPanel(page)
    const couponInput = panel.getByRole('textbox', { name: 'Código promocional' })
    await couponInput.focus()
    await expect(couponInput).toBeFocused()

    const violetEditionId = await firstEditionId(page, 'violet-nomad-314')

    // Dispara duas mudanças na mesma janela de 1 s para verificar o agrupamento do anúncio polite.
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '1.49')
      await window.__kurioMock.triggerPriceChange('violet-nomad-314', ${JSON.stringify(violetEditionId)}, '1.59')
    })()`)

    // Aviso na linha com o preço antigo e o novo.
    await expect(page.getByText('Preço atualizado: 1.19 ETH → 1.49 ETH')).toBeVisible()
    await expect(page.getByText('Preço atualizado: 1.39 ETH → 1.59 ETH')).toBeVisible()

    // Cotação refeita: Emerald Ape (2 × 1.49 = 2.98) + Violet (1.59) + Ivory (1.79) = 6.36 ETH.
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('6.36 ETH')
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('6.376 ETH')

    // O foco no campo de cupom permanece intacto após a atualização em tempo real.
    await expect(couponInput).toBeFocused()

    // Anúncio polite agrupado em uma única fala separada por ". ".
    await expect
      .poll(async () => await announcements(page), { timeout: 5_000 })
      .toContain(
        'O preço de Emerald Ape #042 mudou para 1,49 ETH. O preço de Violet Nomad #314 mudou para 1,59 ETH',
      )

    // O aviso de preço fica até o usuário agir na linha (ex.: alterar a quantidade de Emerald Ape).
    const apeGroup = page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ })
    await apeGroup.getByRole('button', { name: 'Diminuir quantidade' }).click()

    await expect(page.getByText('Preço atualizado: 1.19 ETH → 1.49 ETH')).toHaveCount(0)
    // A outra linha onde o usuário não agiu mantém seu aviso.
    await expect(page.getByText('Preço atualizado: 1.39 ETH → 1.59 ETH')).toBeVisible()
  })

  test('2. triggerStockChange: linha "Esgotado" (fora do total) e "Restam N" com "Ajustar para N"; botão de finalizar bloqueado com motivo até remover ou ajustar', async ({
    page,
  }) => {
    await openFigmaCart(page)
    await collectAnnouncements(page)

    const panel = summaryPanel(page)
    const checkoutBtn = panel.getByRole('button', { name: 'Conectar e finalizar' })
    await expect(checkoutBtn).toBeEnabled()

    const violetEditionId = await firstEditionId(page, 'violet-nomad-314')

    // 1) Violet Nomad esgota (available = 0) e Emerald Ape cai para 1 unidade (insufficient para quantity = 2).
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('violet-nomad-314', ${JSON.stringify(violetEditionId)}, 0)
      await window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-50', 1)
    })()`)

    // Linha esgotada mostra "Esgotado", "Remova este item para finalizar." e sai do subtotal (5.56 - 1.39 = 4.17 ETH).
    await expect(page.getByText('Esgotado').first()).toBeVisible()
    await expect(page.getByText('Remova este item para finalizar.')).toBeVisible()
    await expect(page.getByText('1.39 ETH fora do total')).toBeVisible()
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('4.17 ETH')

    // Linha com estoque insuficiente mostra "Restam 1" e botão "Ajustar para 1".
    await expect(page.getByText('Restam 1')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajustar para 1' })).toBeVisible()

    // Botão "Conectar e finalizar" bloqueado com motivo de item esgotado (prioridade sobre estoque insuficiente).
    await expect(checkoutBtn).toBeDisabled()
    await expect(panel.getByText('Remova os itens esgotados para continuar.')).toBeVisible()
    const reasonId = await checkoutBtn.getAttribute('aria-describedby')
    expect(reasonId).toBeTruthy()
    await expect(page.locator(`[id="${reasonId ?? ''}"]`)).toHaveText(
      'Remova os itens esgotados para continuar.',
    )

    // 2) Remove o item esgotado: botão continua bloqueado, agora pelo motivo de quantidade acima do estoque.
    await page.getByRole('button', { name: /^Remover Violet Nomad #314/ }).click()
    await expect(checkoutBtn).toBeDisabled()
    await expect(
      panel.getByText('Ajuste as quantidades acima do estoque para continuar.'),
    ).toBeVisible()

    // 3) Clica em "Ajustar para 1": envia PATCH imediato, atualiza quantidade para 1 e libera o botão de finalizar.
    // No mobile, LineQuantity (absolute) sobrepõe visualmente o botão; dispatchEvent('click') dispara a ação diretamente.
    await page.getByRole('button', { name: 'Ajustar para 1' }).dispatchEvent('click')
    await expect(
      page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ }).getByRole('status'),
    ).toHaveText('1')
    await expect(page.getByText('Restam 1')).toHaveCount(0)
    await expect(checkoutBtn).toBeEnabled()
    await expect(
      panel.getByText('Ajuste as quantidades acima do estoque para continuar.'),
    ).toHaveCount(0)
    await expect
      .poll(async () => await announcements(page))
      .toContain('Quantidade de Emerald Ape #042 ajustada para 1')
  })

  test('3. evento de NFT fora do carrinho é ignorado; dropConnections invalida cart e quote; inscrições canceladas ao sair da página', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const neonEditionId = await firstEditionId(page, 'neon-vessel-552')

    const api = recordApi(page)
    await collectAnnouncements(page)

    // 1) Evento de NFT que não está no carrinho (neon-vessel-552) é ignorado.
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('neon-vessel-552', ${JSON.stringify(neonEditionId)}, '4.99')
    })()`)
    await expect(summaryPanel(page).getByText('Subtotal').locator('..')).toContainText('5.56 ETH')
    expect(api.calls('GET', '/cart')).toHaveLength(0)
    expect(api.calls('POST', '/quote')).toHaveLength(0)
    expect(await announcements(page)).toEqual([])

    // 2) dropConnections derruba o socket; ao reconectar, invalida cart e quote.
    api.clear()
    await page.evaluate(`window.__kurioMock.dropConnections(100)`)
    await expect.poll(() => api.calls('GET', '/cart').length, { timeout: 5_000 }).toBeGreaterThan(0)
    await expect
      .poll(() => api.calls('POST', '/quote').length, { timeout: 5_000 })
      .toBeGreaterThan(0)

    // 3) Ao sair de /carrinho para uma rota sem NFTs (/perfil/dados), as inscrições são canceladas.
    await signInAs(page, 'primary')
    await page.evaluate(`window.__kurio.router.navigate({ to: '/perfil/dados' })`)
    await expect(page).toHaveURL(/\/perfil\/dados$/)
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    api.clear()
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '3.50')
    })()`)
    expect(api.calls('GET', '/cart')).toHaveLength(0)
    expect(api.calls('POST', '/quote')).toHaveLength(0)
  })
})
