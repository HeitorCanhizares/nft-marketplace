/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  ready,
  scenarios,
  seedFigmaCart,
  seedOrder,
  signInAs,
} from './helpers.ts'

async function setupSignedInWithCart(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
}

async function getCartItemCount(page: Page): Promise<number> {
  return page.evaluate<number>(`(async () => {
    const res = await window.__kurio.http.get('/cart')
    return res.data.itemCount
  })()`)
}

test.describe('13-080: Confirmação — desfechos do pedido, recusa, estoque e anúncios/foco', () => {
  test('1. payment-confirmed e payment-declined forçados; conferência no mock sem sorteio', async ({
    page,
  }) => {
    await scenarios(page, 'payment-confirmed')
    await setupSignedInWithCart(page)

    // Criação forçada de payment-confirmed via seedOrder.
    const confirmedId = await seedOrder(page, { status: 'confirmed' })
    const confirmedRecord = await page.evaluate<{ status: string; txHash?: string }>(
      `(async () => {
        const order = await window.__kurioMock.stores.ordersStore.get(${JSON.stringify(confirmedId)})
        return { status: order?.status ?? '', txHash: order?.txHash }
      })()`,
    )
    expect(confirmedRecord.status).toBe('confirmed')
    expect(confirmedRecord.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/)

    // Criação forçada de payment-declined via seedOrder.
    const declinedId = await seedOrder(page, {
      status: 'declined',
      declineReason: 'Pagamento recusado pela carteira simulada.',
    })
    const declinedRecord = await page.evaluate<{ status: string; declineReason?: string }>(
      `(async () => {
        const order = await window.__kurioMock.stores.ordersStore.get(${JSON.stringify(declinedId)})
        return { status: order?.status ?? '', declineReason: order?.declineReason }
      })()`,
    )
    expect(declinedRecord.status).toBe('declined')
    expect(declinedRecord.declineReason).toBe('Pagamento recusado pela carteira simulada.')

    // Mock store tem os registros gravados deterministamente.
    const totalOrders = await page.evaluate<number>(
      `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId('user-teste')).length)()`,
    )
    expect(totalOrders).toBeGreaterThanOrEqual(2)
  })

  test('2. recusado: declineReason exibido, itens continuam no carrinho, GET /cart igual, sem recibo/txHash e link voltar', async ({
    page,
  }) => {
    await scenarios(page, 'payment-declined')
    await setupSignedInWithCart(page)

    const cartCountBefore = await getCartItemCount(page)
    expect(cartCountBefore).toBe(4)

    // Acompanha a recusa via URL do pedido criado com status declined
    const orderId = await seedOrder(page, {
      status: 'declined',
      declineReason: 'Pagamento recusado pela carteira simulada.',
    })

    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    // declineReason e mensagens de recusa visíveis
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento recusado' })).toBeVisible()
    await expect(page.getByText('Pagamento recusado pela carteira simulada.')).toBeVisible()
    await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()

    // Sem recibo e sem txHash
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)
    await expect(page.getByText(/^0x[0-9a-fA-F]{64}$/)).toHaveCount(0)
    await expect(page.getByText('Transação simulada')).toHaveCount(0)

    // GET /cart igual antes e depois
    const cartCountAfter = await getCartItemCount(page)
    expect(cartCountAfter).toBe(cartCountBefore)

    // Botão Voltar ao carrinho navega para /carrinho
    const backToCart = page.getByRole('link', { name: 'Voltar ao carrinho' })
    await expect(backToCart).toBeVisible()
    await backToCart.click()
    await expect(page).toHaveURL(/\/carrinho$/)
  })

  test('3. recusa por estoque no momento da confirmação: declined com mensagem de esgotamento e estoque/carrinho intactos', async ({
    page,
  }) => {
    await scenarios(page, 'payment-confirmed')
    await setupSignedInWithCart(page)

    const orderId = await seedOrder(page, { status: 'pending' })

    // Esgota o estoque de Emerald Ape antes da liquidação de 3 s
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.editions = nft.editions.map((ed) => ({ ...ed, available: 0 }))
        await nftsStore.put(nft)
      }
    })()`)

    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    // O pedido entra em declined com a mensagem de estoque ao liquidar em ~3s
    await expect(
      page.getByText('Um dos NFTs esgotou durante o pagamento.', { exact: true }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()

    // O carrinho continua com os itens intactos (removePurchased não é chamado em declined)
    const cartCount = await getCartItemCount(page)
    expect(cartCount).toBe(4)

    // Verifica que o pedido no banco ficou declined com o motivo de estoque e sem txHash
    const savedOrder = await page.evaluate<{ status: string; txHash?: string }>(
      `(async () => {
        const rec = await window.__kurioMock.stores.ordersStore.get(${JSON.stringify(orderId)})
        return { status: rec?.status ?? '', txHash: rec?.txHash }
      })()`,
    )
    expect(savedOrder.status).toBe('declined')
    expect(savedOrder.txHash).toBeUndefined()
  })

  test('4. transições anunciam em assertive, foco não sai do título no diálogo (desktop), recibo e recusa nunca aparecem enquanto pending', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name === 'desktop'
    await scenarios(page, 'payment-confirmed')
    await setupSignedInWithCart(page)

    // Garante estoque suficiente para a liquidação de seedOrder (violet 6, ivory 9)
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      for (const id of ['emerald-ape-042', 'violet-nomad-314', 'ivory-baron-088']) {
        const nft = await nftsStore.get(id)
        if (nft) {
          nft.editions = nft.editions.map((ed) => ({ ...ed, available: 100 }))
          await nftsStore.put(nft)
        }
      }
    })()`)

    // 1) Estado pendente inicial (liquidação natural em ~3s)
    const orderId = await seedOrder(page, { status: 'pending' })
    await page.goto(`/pedido/${orderId}`)
    await ready(page)
    await collectAnnouncements(page)

    // Enquanto pending: sem recibo e sem recusa
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toHaveCount(0)
    await expect(page.getByText('Pagamento recusado')).toHaveCount(0)

    if (isDesktop) {
      const heading = page.getByRole('heading', { level: 1, name: 'Confirmando pagamento' })
      await expect(heading).toBeFocused()
    }

    // 2) Transição para confirmed após ~3s
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })

    // Anúncio assertive de confirmação
    await expect.poll(async () => await announcements(page)).toContain('Pedido confirmado')

    if (isDesktop) {
      const confirmedHeading = page.getByRole('heading', {
        level: 1,
        name: 'Pedido confirmado',
      })
      await expect(confirmedHeading).toBeFocused()
    }
  })
})
