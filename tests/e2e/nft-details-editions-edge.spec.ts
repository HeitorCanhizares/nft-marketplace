// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { openApp, ready, recordApi, seedCart } from './helpers.ts'

const PATH = '/nft/emerald-ape-042'

async function go(page: Page, path = PATH) {
  await page.goto(path)
  await ready(page)
}

test.describe('Detalhes — edições, limites de estoque e stepper (13-030)', () => {
  test('1. o stepper respeita estoque menos o que já está no carrinho, limites (+/-), textos de máximo e teto de ABERTA', async ({
    page,
  }) => {
    await openApp(page)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 2 },
    ])
    await go(page)

    // Texto de unidades já no carrinho para a edição 1/50
    await expect(page.getByText('2 já no seu carrinho').first()).toBeVisible()

    const minusBtn = page.getByRole('button', { name: 'Diminuir quantidade' })
    const plusBtn = page.getByRole('button', { name: 'Aumentar quantidade' })
    const outputQty = page.locator('output[aria-label="Quantidade"]').first()

    // Quantidade inicial é 1; "-" desabilitado
    await expect(outputQty).toHaveText('1')
    await expect(minusBtn).toBeDisabled()

    // Edição 1/1: estoque 1, 0 no carrinho -> max 1, "+" desabilitado de imediato
    await page.getByRole('radio', { name: '1/1', exact: true }).click()
    await expect(page.getByText('Máximo disponível: 1').first()).toBeVisible()
    await expect(plusBtn).toBeDisabled()
    await expect(minusBtn).toBeDisabled()

    // Edição ABERTA: teto de 99 por compra
    await page.getByRole('radio', { name: 'ABERTA' }).click()
    await expect(plusBtn).toBeEnabled()
    await plusBtn.click()
    await expect(outputQty).toHaveText('2')
    await expect(minusBtn).toBeEnabled()
  })

  test('2. edição esgotada com pílula desabilitada e texto Esgotado; NFT todo esgotado desabilita COMPRAR', async ({
    page,
  }) => {
    await go(page)

    // Edição 1/10 esgota via tempo real
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-10', 0)
    })()`)

    const edition10 = page.getByRole('radio', { name: /1\/10/ })
    await expect(edition10).toBeDisabled()
    await expect(edition10.getByText('Esgotado')).toBeVisible()

    // Todas as edições zeradas no banco -> NFT todo esgotado
    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        for (const ed of nft.editions) ed.available = 0
        nft.soldOut = true
        await mock.stores.nftsStore.put(nft)
      }
    })()`)

    await page.reload()
    await ready(page)

    const buyBtn = page.getByRole('button', { name: 'Esgotado' }).first()
    await expect(buyBtn).toBeVisible()
    await expect(buyBtn).toBeDisabled()
  })

  test('3. trocar de edição reseta a quantidade para 1, atualiza o preço e navega pelo teclado com setas', async ({
    page,
  }) => {
    await go(page)

    const plusBtn = page.getByRole('button', { name: 'Aumentar quantidade' })
    const outputQty = page.locator('output[aria-label="Quantidade"]').first()

    // Aumenta quantidade para 3 na edição padrão (1/50 a 1.19 ETH)
    await plusBtn.click()
    await plusBtn.click()
    await expect(outputQty).toHaveText('3')

    // Troca para edição 1/10 (1.39 ETH)
    await page.getByRole('radio', { name: '1/10' }).click()
    await expect(page.getByText('1.39 ETH').first()).toBeVisible()
    await expect(outputQty).toHaveText('1')

    // Navegação por teclado nas setas dentro do RadioGroup
    const radio10 = page.getByRole('radio', { name: '1/10' })
    await radio10.focus()
    await page.keyboard.press('ArrowRight')

    const radio50 = page.getByRole('radio', { name: '1/50' })
    await expect(radio50).toBeFocused()
    await page.keyboard.press('Space')

    await expect(radio50).toBeChecked()
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()
    await expect(outputQty).toHaveText('1')
  })

  test('4. tudo já no carrinho: COMPRAR navega sem POST, botão mobile desabilitado e aviso exibido', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    // Coloca a única unidade da edição 1/1 no carrinho
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-1', quantity: 1 },
    ])
    await go(page)

    // Seleciona a edição 1/1
    await page.getByRole('radio', { name: '1/1', exact: true }).click()

    // Mensagem indicando que todas as unidades já estão no carrinho
    await expect(
      page.getByText('Você já tem todas as unidades disponíveis no carrinho').first(),
    ).toBeVisible()

    const api = recordApi(page)

    if (testInfo.project.name === 'desktop') {
      const buyBtn = page.getByRole('button', { name: 'COMPRAR', exact: true })
      await expect(buyBtn).toBeEnabled()
      await buyBtn.click()

      await expect(page).toHaveURL(/\/carrinho/)
      expect(api.calls('POST', '/cart/items').length).toBe(0)
    } else {
      const cartBtnMobile = page.getByRole('button', { name: 'Adicionar ao carrinho' })
      await expect(cartBtnMobile).toBeDisabled()

      const buyBtnMobile = page.getByRole('button', { name: 'Comprar NFT' })
      await buyBtnMobile.click()

      await expect(page).toHaveURL(/\/carrinho/)
      expect(api.calls('POST', '/cart/items').length).toBe(0)
    }
  })
})
