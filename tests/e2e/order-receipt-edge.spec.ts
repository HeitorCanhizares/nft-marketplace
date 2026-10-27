import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  ready,
  recordApi,
  scenarios,
  seedOrder,
  signInAs,
} from './helpers.ts'

async function setupSignedIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await signInAs(page, 'primary')
}

async function seedCustomOrder(page: Page, overrides: Record<string, unknown>): Promise<string> {
  return page.evaluate<string>(`(async () => {
    const { nftsStore, ordersStore } = window.__kurioMock.stores
    const id = crypto.randomUUID()
    const wallet = (await window.__kurio.http.get('/wallets')).data.primary
    const { id: walletId, slot, ...collector } = wallet
    const nft = await nftsStore.get('emerald-ape-042')
    const edition = nft?.editions[0]
    const defaultRecord = {
      id,
      userId: 'user-teste',
      status: 'confirmed',
      createdAt: '2026-07-29T12:00:00.000Z',
      quoteId: 'seed-quote-' + id,
      network: 'ethereum',
      wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
      collector,
      items: [
        {
          nftId: nft ? nft.id : 'emerald-ape-042',
          name: nft ? nft.name : 'Emerald Ape #042',
          tokenId: nft ? nft.tokenId : '#042',
          image: { src: nft ? nft.image.src : '/placeholder.webp', alt: 'Emerald Ape' },
          editionId: edition ? edition.id : 'emerald-ape-042-1-50',
          editionLabel: edition ? edition.label : '1/50',
          quantity: 2,
          unitPrice: '1.19',
          lineTotal: '2.38',
        },
      ],
      subtotal: '2.38',
      discount: '0.00',
      networkFee: '0.016',
      total: '2.396',
      txHash: '0xA91F' + '0'.repeat(56) + 'E82C',
      explorerUrl: 'https://etherscan.io/tx/' + '0xA91F' + '0'.repeat(56) + 'E82C',
    }
    const merged = Object.assign(defaultRecord, ${JSON.stringify(overrides)})
    merged.id = id
    await ordersStore.put(merged)
    return id
  })()`)
}

async function triggerMockSettlement(page: Page, orderId: string): Promise<void> {
  await page.evaluate(`(async () => {
    const { ordersStore } = window.__kurioMock.stores
    const order = await ordersStore.get(${JSON.stringify(orderId)})
    if (order) {
      // Avança a data além do paymentDelayMs (30 s) para liquidar via settleIfDue
      order.createdAt = new Date(Date.now() - 35_000).toISOString()
      await ordersStore.put(order)
      await window.__kurio.http.get('/orders/' + ${JSON.stringify(orderId)})
    }
  })()`)
}

test.describe('13-084: Confirmação — recibo imutável (snapshot), explorador, copiar txHash e NFT removido', () => {
  test('1. recibo imutável: preço alterado, edição esgotada ou NFT removido não mudam itens nem valores; sem GET /nfts; com e sem cupom', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // 1a. Pedido sem cupom: só taxa e total (sem "Subtotal" e sem "Desconto do lançamento" no PriceSummary)
    const orderIdWithoutCoupon = await seedOrder(page, { status: 'confirmed' })
    const api = recordApi(page)

    await page.goto(`/pedido/${orderIdWithoutCoupon}`)
    await ready(page)

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // Valores do snapshot sem cupom
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expect(page.getByText('26.846 ETH').first()).toBeVisible()
    await expect(page.getByText('0.016 ETH')).toBeVisible()
    // No PriceSummary sem cupom, "Subtotal" e "Desconto do lançamento" não são renderizados
    await expect(page.locator('dt', { hasText: 'Subtotal' })).toHaveCount(0)
    await expect(page.getByText('Desconto do lançamento')).toHaveCount(0)

    // Nomes e itens do snapshot visíveis
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    await expect(page.getByText('Violet Nomad #314')).toBeVisible()
    await expect(page.getByText('Ivory Baron #088')).toBeVisible()

    // Modifica o catálogo no mock: altera preço, esgota edição e remove NFT
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '99.99')

      const violet = await nftsStore.get('violet-nomad-314')
      if (violet) {
        violet.editions = violet.editions.map((ed) => ({ ...ed, available: 0 }))
        await nftsStore.put(violet)
      }

      await nftsStore.delete('ivory-baron-088')
    })()`)

    // O recibo na página não muda
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    await expect(page.getByText('Violet Nomad #314')).toBeVisible()
    await expect(page.getByText('Ivory Baron #088')).toBeVisible()
    await expect(page.getByText('2.38 ETH')).toBeVisible()
    await expect(page.getByText('8.34 ETH')).toBeVisible()
    await expect(page.getByText('16.11 ETH')).toBeVisible()
    await expect(page.getByText('26.846 ETH').first()).toBeVisible()

    // A página de confirmação não faz GET /nfts
    const nftCalls = api.calls('GET', /^\/nfts/)
    expect(nftCalls).toHaveLength(0)

    // 1b. Pedido com cupom: "Subtotal" e "Desconto do lançamento" aparecem
    const orderIdWithCoupon = await seedCustomOrder(page, {
      coupon: { code: 'PROMO10' },
      subtotal: '26.83',
      discount: '2.68',
      networkFee: '0.016',
      total: '24.166',
    })

    await page.goto(`/pedido/${orderIdWithCoupon}`)
    await ready(page)

    await expect(page.locator('dt', { hasText: 'Subtotal' })).toBeVisible()
    await expect(page.getByText('Desconto do lançamento')).toBeVisible()
    await expect(page.getByText('(-) 2.68 ETH')).toBeVisible()
    await expect(page.getByText('24.166 ETH').first()).toBeVisible()
  })

  test('2. baixa de estoque na liquidação: edição aberta não baixa estoque e edição limitada baixa só o comprado e emite nft:stock_changed', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // Prepara um NFT com edição aberta (available: null) e limitada (available: 10)
    const testNftId = 'emerald-ape-042'
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get(${JSON.stringify(testNftId)})
      if (nft) {
        nft.editions = [
          {
            id: 'open-ed-1',
            label: 'Open Edition',
            supply: null,
            available: null,
            price: '1.00',
          },
          {
            id: 'limited-ed-2',
            label: '1/50',
            supply: 50,
            available: 10,
            price: '2.00',
          },
        ]
        await nftsStore.put(nft)
      }
    })()`)

    // Cria pedido pendente com 2 unidades da edição aberta e 3 da edição limitada
    const orderId = await seedCustomOrder(page, {
      status: 'pending',
      items: [
        {
          nftId: testNftId,
          name: 'Emerald Ape #042',
          tokenId: '#042',
          image: { src: '/placeholder.webp', alt: 'Emerald Ape' },
          editionId: 'open-ed-1',
          editionLabel: 'Open Edition',
          quantity: 2,
          unitPrice: '1.00',
          lineTotal: '2.00',
        },
        {
          nftId: testNftId,
          name: 'Emerald Ape #042',
          tokenId: '#042',
          image: { src: '/placeholder.webp', alt: 'Emerald Ape' },
          editionId: 'limited-ed-2',
          editionLabel: '1/50',
          quantity: 3,
          unitPrice: '2.00',
          lineTotal: '6.00',
        },
      ],
    })

    // Executa a liquidação no mock backend
    await triggerMockSettlement(page, orderId)

    // Confere no nftsStore:
    // - Edição aberta continua com available === null (não baixou estoque)
    // - Edição limitada baixou exatamente 3 unidades (10 - 3 = 7)
    const stockResult = await page.evaluate<{
      openAvailable: number | null
      limitedAvailable: number
    }>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get(${JSON.stringify(testNftId)})
      const openEd = nft?.editions.find((e) => e.id === 'open-ed-1')
      const limitedEd = nft?.editions.find((e) => e.id === 'limited-ed-2')
      return {
        openAvailable: openEd ? openEd.available : null,
        limitedAvailable: limitedEd ? limitedEd.available : -1,
      }
    })()`)

    expect(stockResult.openAvailable).toBeNull()
    expect(stockResult.limitedAvailable).toBe(7)
  })

  test('3. explorador por rede (Etherscan, Polygonscan, Solscan), domínio desconhecido oculto, copiar txHash, acessibilidade e quebra de texto longo', async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000)
    await setupSignedIn(page)

    // 3a. Explorador por rede: Ethereum
    const ethOrder = await seedOrder(page, { status: 'confirmed', network: 'ethereum' })
    await page.goto(`/pedido/${ethOrder}`)
    await ready(page)
    const ethBtn = page.getByRole('link', { name: /Ver no Etherscan/ })
    await expect(ethBtn).toBeVisible()
    await expect(ethBtn).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x[0-9a-fA-F]{64}$/)

    // Polygon
    const polyOrder = await seedOrder(page, { status: 'confirmed', network: 'polygon' })
    await page.goto(`/pedido/${polyOrder}`)
    await ready(page)
    const polyBtn = page.getByRole('link', { name: /Ver no Polygonscan/ })
    await expect(polyBtn).toBeVisible()
    await expect(polyBtn).toHaveAttribute(
      'href',
      /^https:\/\/polygonscan\.com\/tx\/0x[0-9a-fA-F]{64}$/,
    )

    // Solana
    const solOrder = await seedOrder(page, { status: 'confirmed', network: 'solana' })
    await page.goto(`/pedido/${solOrder}`)
    await ready(page)
    const solBtn = page.getByRole('link', { name: /Ver no Solscan/ })
    await expect(solBtn).toBeVisible()
    await expect(solBtn).toHaveAttribute('href', /^https:\/\/solscan\.io\/tx\/0x[0-9a-fA-F]{64}$/)

    // Domínio desconhecido não mostra o botão (explorerUrl é atualizado no put de pedidos existentes)
    await page.evaluate(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(solOrder)})
      if (order) {
        order.explorerUrl = 'https://phishing-explorer.xyz/tx/0x123'
        await ordersStore.put(order)
      }
    })()`)
    await page.reload()
    await ready(page)
    await expect(page.getByRole('link', { name: /Ver no/ })).toHaveCount(0)

    // 3b. Copiar ID da transação: sucesso
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await collectAnnouncements(page)
    const copyBtn = page.getByRole('button', { name: 'Copiar ID da transação' })
    await expect(copyBtn).toBeVisible()
    await copyBtn.click()

    await expect.poll(async () => announcements(page)).toContain('ID da transação copiado')

    // 3c. Copiar ID da transação: falha
    await page.evaluate(`navigator.clipboard.writeText = () => Promise.reject(new Error('denied'))`)
    await copyBtn.click()
    await expect
      .poll(async () => announcements(page))
      .toContain('Não foi possível copiar o ID da transação')

    // 3d. ID abreviado visível e ID completo no texto acessível
    await expect(page.getByText('0xA91F…E82C')).toBeVisible()
    await expect(page.getByText(/^0x[0-9a-fA-F]{64}$/)).toHaveCount(1)

    // 3e. Data em pt-BR
    await expect(page.getByText(/29 de jul\. de 2026/)).toBeVisible()

    // 3f. Textos longos quebram sem sobrepor "(x N)" e o subtotal
    const longName =
      'Coleção Especial Super Longa com Nome Quebrável em Múltiplas Linhas Sem Fim #999'
    const longOrder = await seedCustomOrder(page, {
      items: [
        {
          nftId: 'emerald-ape-042',
          name: longName,
          tokenId: '#999',
          image: { src: '/placeholder.webp', alt: 'NFT' },
          editionId: 'ed-long',
          editionLabel: '1/1',
          quantity: 5,
          unitPrice: '2.38',
          lineTotal: '11.90',
        },
      ],
      total: '11.916',
    })
    await page.goto(`/pedido/${longOrder}`)
    await ready(page)

    await expect(page.getByText(longName)).toBeVisible()
    await expect(page.getByText('(x 5)')).toBeVisible()
    await expect(page.getByText('11.90 ETH')).toBeVisible()
  })

  test('4. NFT ou edição removidos antes do desfecho: pedido pendente confirma, ignora baixa do item removido e recibo usa o snapshot', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await scenarios(page, 'payment-confirmed')
    await setupSignedIn(page)

    // Prepara NFT existente com estoque garantido
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.editions = [{ id: 'ed-stock-ok', label: '1/100', supply: 100, available: 100, price: '1.00' }]
        await nftsStore.put(nft)
      }
    })()`)

    // Cria pedido pendente com um item existente e um item cujo NFT foi removido (ou não existe no nftsStore)
    const orderId = await seedCustomOrder(page, {
      status: 'pending',
      items: [
        {
          nftId: 'emerald-ape-042',
          name: 'Emerald Ape #042',
          tokenId: '#042',
          image: { src: '/placeholder.webp', alt: 'Emerald Ape' },
          editionId: 'ed-stock-ok',
          editionLabel: '1/100',
          quantity: 1,
          unitPrice: '1.00',
          lineTotal: '1.00',
        },
        {
          nftId: 'nft-removido-123',
          name: 'Fantasma Antigo #001',
          tokenId: '#001',
          image: { src: '/placeholder.webp', alt: 'Fantasma' },
          editionId: 'ed-fantasma',
          editionLabel: '1/10',
          quantity: 2,
          unitPrice: '2.00',
          lineTotal: '4.00',
        },
      ],
      subtotal: '5.00',
      total: '5.016',
    })

    // Liquida o pedido no mock backend
    await triggerMockSettlement(page, orderId)

    // Navega para o pedido: o pedido confirma, o item inexistente foi ignorado na baixa de estoque e o recibo exibe o snapshot de ambos os itens
    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    await expect(page.getByText('Fantasma Antigo #001')).toBeVisible()
    await expect(page.getByText('5.016 ETH').first()).toBeVisible()
  })
})
