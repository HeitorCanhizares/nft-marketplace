import { expect, test, type Locator, type Page } from '@playwright/test'

import { delayApi, openApp, ready, scenarios, seedCart, seedFigmaCart } from './helpers.ts'

function summaryPanel(page: Page): Locator {
  // Filtra a seção visível do resumo do pedido (desktop ou mobile).
  return page
    .locator('section:visible', { hasText: 'Resumo do pedido' })
    .or(page.getByRole('region', { name: 'Resumo do pedido' }))
}

function activePanel(page: Page): Locator {
  // Em todas as telas o painel visível do resumo é uma section visível.
  return page.locator('section:visible').first()
}

type QuoteValues = {
  subtotal: string
  discount: string
  networkFee: string
  total: string
}

async function fetchQuote(
  page: Page,
  network?: 'ethereum' | 'polygon' | 'solana',
): Promise<QuoteValues> {
  return page.evaluate<QuoteValues>(`(async () => {
    const body = ${JSON.stringify(network ? { network } : {})}
    const q = (await window.__kurio.http.post('/quote', body)).data
    return {
      subtotal: q.subtotal,
      discount: q.discount,
      networkFee: q.networkFee,
      total: q.total,
    }
  })()`)
}

test.describe('Carrinho — resumo, cotação por rede e esgotado fora do subtotal (13-043)', () => {
  test('1. resumo em atualização (aria-busy) enquanto recalcula; server-error na cotação mostra "Tentar novamente" no resumo', async ({
    page,
  }) => {
    await openApp(page)
    await seedFigmaCart(page)
    // Força erro 500 na rota de cotação para exibir o estado de erro do PriceSummary.
    await scenarios(page, 'server-error:POST /quote')
    await page.goto('/carrinho')
    await ready(page)

    const panel = activePanel(page)
    await expect(panel.getByText('Não foi possível calcular os valores.')).toBeVisible({
      timeout: 6_000,
    })
    const retry = panel.getByRole('button', { name: 'Tentar novamente' })
    await expect(retry).toBeVisible()

    // Ao limpar o cenário e clicar em "Tentar novamente", a cotação entra em atualização (aria-busy) e depois exibe os valores.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await delayApi(page, '**/api/quote', 1_500, { once: true })
    await retry.click()

    // Seletor CSS necessário para verificar aria-busy="true" no container do PriceSummary durante a atualização.
    await expect(panel.locator('[aria-busy="true"]')).toBeVisible()
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('5.56 ETH')
    await expect(panel.locator('[aria-busy="true"]')).toHaveCount(0)

    // Ao recalcular (ex.: aplicando cupom com atraso na cotação), mantém os valores anteriores com aria-busy="true" e texto sr-only.
    await delayApi(page, '**/api/quote', 1_500, { once: true })
    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
    await panel.getByRole('button', { name: 'Aplicar' }).click()

    await Promise.all([
      expect(panel.locator('[aria-busy="true"]')).toBeVisible(),
      expect(panel.getByText('Atualizando valores')).toBeAttached(),
    ])
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('5.02 ETH')
    await expect(panel.locator('[aria-busy="true"]')).toHaveCount(0)
  })

  test('2. valores exibidos idênticos às strings da API para vários carrinhos e redes (Ethereum 0.016, Polygon 0.002, Solana 0.0005 e carrinho vazio 0.00)', async ({
    page,
  }) => {
    await openApp(page)

    // 1) Carrinho vazio: API devolve '0.00' em todos os campos monetários.
    const emptyQuote = await fetchQuote(page, 'ethereum')
    expect(emptyQuote).toEqual({
      subtotal: '0.00',
      discount: '0.00',
      networkFee: '0.00',
      total: '0.00',
    })

    // 2) Carrinho Figma (Emerald Ape ×2, Violet Nomad, Ivory Baron) em Ethereum, Polygon e Solana.
    await seedFigmaCart(page)
    const ethQuote = await fetchQuote(page, 'ethereum')
    const polyQuote = await fetchQuote(page, 'polygon')
    const solQuote = await fetchQuote(page, 'solana')

    expect(ethQuote.networkFee).toBe('0.016')
    expect(polyQuote.networkFee).toBe('0.002')
    expect(solQuote.networkFee).toBe('0.0005')
    expect(ethQuote.subtotal).toBe('5.56')
    expect(ethQuote.total).toBe('5.576')
    expect(polyQuote.total).toBe('5.562')
    expect(solQuote.total).toBe('5.5605')

    // Compara os textos renderizados na tela com as strings exatas vindas da API da cotação.
    // Nota: O carrinho (/carrinho) não possui seletor de rede (a escolha de rede ocorre em /pagamento).
    // Assim, a cotação padrão exibida no carrinho é a da rede Ethereum (0.016 ETH).
    // As taxas das redes Polygon (0.002) e Solana (0.0005) e carrinho vazio (0.00) são validadas na API acima.
    await page.goto('/carrinho')
    await ready(page)

    const apiQuote = await fetchQuote(page, 'ethereum')
    const panel = summaryPanel(page)

    await expect(panel.getByText('Subtotal').locator('..')).toContainText(
      `${apiQuote.subtotal} ETH`,
    )
    await expect(panel.getByText('Desconto do lançamento').locator('..')).toContainText(
      `(-) ${apiQuote.discount} ETH`,
    )
    await expect(panel.getByText('Taxa de rede').locator('..')).toContainText(
      `${apiQuote.networkFee} ETH`,
    )
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText(
      `${apiQuote.total} ETH`,
    )

    // 3) Segundo carrinho (edição ABERTA ×3 + cupom GENESIS5) comparado com a string da API.
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await page.evaluate(`localStorage.removeItem('kurio:guest-cart-id')`)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-aberta', quantity: 3 },
    ])
    await page.goto('/carrinho')
    await ready(page)

    const secondPanel = summaryPanel(page)
    await secondPanel.getByRole('textbox', { name: 'Código promocional' }).fill('GENESIS5')
    await secondPanel.getByRole('button', { name: 'Aplicar' }).click()
    await expect(secondPanel.getByText('Cupom GENESIS5 aplicado')).toBeVisible()

    const secondQuote = await fetchQuote(page, 'ethereum')
    await expect(secondPanel.getByText('Subtotal').locator('..')).toContainText(
      `${secondQuote.subtotal} ETH`,
    )
    await expect(secondPanel.getByText('Desconto do lançamento').locator('..')).toContainText(
      `(-) ${secondQuote.discount} ETH`,
    )
    await expect(secondPanel.getByText('Taxa de rede').locator('..')).toContainText(
      `${secondQuote.networkFee} ETH`,
    )
    await expect(secondPanel.getByText('Total', { exact: true }).locator('..')).toContainText(
      `${secondQuote.total} ETH`,
    )
  })

  test('3. item esgotado fica fora do subtotal (total riscado e texto "fora do total" para leitor de tela); insufficient entra com a quantidade pedida', async ({
    page,
  }) => {
    await openApp(page)
    await seedFigmaCart(page)

    // Violet Nomad (1.39 ETH) fica esgotado (available = 0) e Emerald Ape (2 × 1.19 = 2.38 ETH) fica insufficient (available = 1).
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const violet = await nftsStore.get('violet-nomad-314')
      if (violet) {
        violet.editions = violet.editions.map((e, i) => (i === 0 ? { ...e, available: 0 } : e))
        await nftsStore.put(violet)
      }
      const ape = await nftsStore.get('emerald-ape-042')
      if (ape) {
        ape.editions = ape.editions.map((e) =>
          e.id === 'emerald-ape-042-1-50' ? { ...e, available: 1 } : e,
        )
        await nftsStore.put(ape)
      }
    })()`)

    await page.goto('/carrinho')
    await ready(page)

    // Linha esgotada (Violet Nomad, 1.39 ETH): aviso "Esgotado", valor riscado (line-through) e "fora do total" no texto acessível.
    await expect(page.getByText('Esgotado').first()).toBeVisible()
    await expect(page.getByText('Remova este item para finalizar.')).toBeVisible()
    const struckPrice = page.getByText('1.39 ETH fora do total')
    await expect(struckPrice).toBeVisible()
    await expect(struckPrice).toHaveClass(/line-through/)

    // Linha insufficient (Emerald Ape ×2 com available = 1): mostra "Restam 1" e "Ajustar para 1", mas entra no subtotal com a quantidade pedida (2.38 ETH).
    await expect(page.getByText('Restam 1')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ajustar para 1' })).toBeVisible()

    // Subtotal = Emerald Ape (2.38) + Ivory Baron (1.79) = 4.17 ETH (sem os 1.39 ETH do Violet Nomad esgotado).
    const panel = summaryPanel(page)
    const apiQuote = await fetchQuote(page, 'ethereum')
    expect(apiQuote.subtotal).toBe('4.17')
    expect(apiQuote.total).toBe('4.186')
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('4.17 ETH')
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('4.186 ETH')
  })
})
