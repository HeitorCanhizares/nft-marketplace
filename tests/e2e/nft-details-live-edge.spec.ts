/// <reference lib="dom" />
import { expect, test } from '@playwright/test'

import { announcements, collectAnnouncements, openApp, ready, recordApi } from './helpers.ts'

const NFT_PATH = '/nft/emerald-ape-042'

test.describe('Detalhes — tempo real (13-033)', () => {
  test('1. triggerPriceChange no NFT aberto: preço novo, selo "Atualizado" por 5 s, aviso polite e o foco não se move', async ({
    page,
  }) => {
    await page.clock.install()
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)
    await collectAnnouncements(page)

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()

    const favoriteBtn = page.getByRole('button', { name: /Favoritar/ }).first()
    await favoriteBtn.focus()
    await expect(favoriteBtn).toBeFocused()

    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '2.50')
    })()`)

    await expect(page.getByText('2.50 ETH').first()).toBeVisible()
    await expect(page.getByText('Atualizado').first()).toBeVisible()

    // O foco não se move
    await expect(favoriteBtn).toBeFocused()

    // Aviso polite no anunciador
    await expect
      .poll(async () => announcements(page))
      .toContain('O preço da edição 1/50 de Emerald Ape #042 mudou para 2,50 ETH')

    // Selo "Atualizado" some após 5 segundos
    await page.clock.runFor(5_100)
    await expect(page.getByText('Atualizado')).toHaveCount(0)
  })

  test('2. triggerStockChange: edição selecionada esgota, limite do stepper cai, quantidade ajustada com aviso, troca automática e NFT todo esgotado', async ({
    page,
  }) => {
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)
    await collectAnnouncements(page)

    // A) Stepper com estoque caindo: aumenta para 3 na edição 1/50 (estoque inicial 20)
    const plusBtn = page.getByRole('button', { name: 'Aumentar quantidade' })
    await plusBtn.click()
    await plusBtn.click()
    await expect(page.locator('output[aria-label="Quantidade"]').first()).toHaveText('3')

    // Estoque da edição 1/50 cai para 2
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-50', 2)
    })()`)

    // Quantidade ajustada para 2 com aviso
    await expect(page.locator('output[aria-label="Quantidade"]').first()).toHaveText('2')
    await expect(
      page.getByText('Quantidade ajustada para 2: o estoque mudou.').first(),
    ).toBeVisible()
    await expect
      .poll(async () => announcements(page))
      .toContain('Quantidade ajustada para 2: o estoque mudou.')

    // B) Troca automática para a primeira edição disponível quando a selecionada esgota
    // Seleciona a edição 1/10
    const edition10 = page.getByRole('radio', { name: /1\/10/ })
    await edition10.click()
    await expect(edition10).toHaveAttribute('data-state', 'checked')

    // Esgota a edição 1/10 (disponível = 0)
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-10', 0)
    })()`)

    // Pílula 1/10 fica desabilitada com texto Esgotado
    await expect(edition10).toBeDisabled()
    await expect(edition10.getByText('Esgotado')).toBeVisible()

    // Troca automática para a primeira edição disponível (1/50) com aviso
    const edition50 = page.getByRole('radio', { name: /1\/50/ })
    await expect(edition50).toHaveAttribute('data-state', 'checked')
    await expect(
      page.getByText('A edição 1/10 esgotou. Selecionamos a edição 1/50.').first(),
    ).toBeVisible()
    await expect
      .poll(async () => announcements(page))
      .toContain('A edição 1/10 esgotou. Selecionamos a edição 1/50.')

    // C) NFT todo esgotado desabilita compra
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

    // Botão de compra exibe Esgotado e fica desabilitado
    const buyBtn = page.getByRole('button', { name: 'Esgotado' }).first()
    await expect(buyBtn).toBeVisible()
    await expect(buyBtn).toBeDisabled()
  })

  test('3. dropConnections (reconexão) relê o detalhe do NFT', async ({ page }) => {
    const api = recordApi(page)
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)

    // Espera conectar ao socket
    await expect
      .poll(() => page.evaluate<boolean>('window.__kurio.socket.isSocketConnected()'))
      .toBe(true)

    const initialCalls = api.calls('GET', '/nfts/emerald-ape-042').length

    // Modifica o detalhe do NFT no banco do mock
    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.description = 'Descrição atualizada em tempo real após reconexão.'
        await mock.stores.nftsStore.put(nft)
      }
    })()`)

    // Simula queda e reconexão das conexões WebSocket
    await page.evaluate(`window.__kurioMock.dropConnections(500)`)

    // A reconexão invalida a query de detalhe e dispara novo GET
    await expect
      .poll(() => api.calls('GET', '/nfts/emerald-ape-042').length)
      .toBeGreaterThan(initialCalls)

    await expect(page.getByText('Descrição atualizada em tempo real após reconexão.')).toBeVisible()
  })
})
