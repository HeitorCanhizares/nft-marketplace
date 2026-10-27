/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { ready, recordApi, scenarios, seedFigmaCart, seedOrder, signInAs } from './helpers.ts'

async function setupSignedInWithCart(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
}

async function ensureSeedOrderStock(page: Page) {
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
}

test.describe('13-082: Confirmação — retomada no refresh, redirecionamento de /pagamento e recusa -> Pagamento', () => {
  test('1. refresh em /pedido/:id pendente retoma o acompanhamento e o desfecho chega depois do refresh', async ({
    page,
  }) => {
    await scenarios(page, 'payment-confirmed')
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    const orderId = await seedOrder(page, { status: 'pending' })
    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    // Pendente inicial
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()

    // Recarrega a página durante o acompanhamento pendente
    await page.reload()
    await ready(page)

    // Acompanhamento continua ativo
    await expect(
      page
        .getByText('Confirmando pagamento...')
        .or(page.getByText('Seus NFTs agora estão na sua carteira')),
    ).toBeVisible()

    // Desfecho de confirmação é recebido
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('2. /pagamento com pedido pendente redireciona ao pedido; após desfecho não redireciona (confirmado -> /carrinho; recusado -> Pagamento livre)', async ({
    page,
  }) => {
    await scenarios(page, 'payment-slow')
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    // A) Criação de pedido pendente
    const pendingOrderId = await seedOrder(page, { status: 'pending' })

    // Abrir /pagamento redireciona para o pedido pendente
    await page.goto('/pagamento')
    await expect(page).toHaveURL(new RegExp(`/pedido/${pendingOrderId}$`))

    // B) Após desfecho de confirmação e carrinho esvaziado: ir a /pagamento redireciona ao carrinho
    await page.evaluate(`(async () => {
      const { ordersStore, cartsStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(pendingOrderId)})
      if (order) {
        order.status = 'confirmed'
        order.txHash = '0xA91F' + '0'.repeat(56) + 'E82C'
        await ordersStore.put(order)
      }
      // Esvazia carrinho como ocorre na confirmação
      const cart = await cartsStore.get('cart-user-teste')
      if (cart) {
        cart.items = []
        cart.itemCount = 0
        await cartsStore.put(cart)
      }
      await window.__kurio.queryClient.invalidateQueries()
    })()`)

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/carrinho$/)

    // C) Com pedido recusado e carrinho contendo itens: /pagamento é livre
    // (logado, o item entra pelo cliente HTTP do app, no carrinho do usuário)
    await page.evaluate(`window.__kurio.http.post('/cart/items', {
      nftId: 'emerald-ape-042',
      editionId: 'emerald-ape-042-1-50',
      quantity: 1,
    })`)
    await page.reload()
    await ready(page)

    const declinedOrderId = await seedOrder(page, {
      status: 'declined',
      declineReason: 'Recusa teste',
    })

    // Garante que não há pedidos pendentes
    await page.evaluate(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(declinedOrderId)})
      if (order) {
        order.status = 'declined'
        await ordersStore.put(order)
      }
      await window.__kurio.queryClient.invalidateQueries()
    })()`)

    await page.goto('/pagamento')
    await ready(page)
    // Permanece na rota de pagamento livre
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  })

  test('3. sai pendente, confirma fora, volta a /pagamento e cai no recibo com kurio:checkout limpo; recibo antigo não apaga checkout novo', async ({
    page,
  }) => {
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    const orderId = await seedOrder(page, { status: 'pending' })

    // Grava kurio:checkout na sessão simulando pagamento iniciado
    await page.evaluate(`(async (id) => {
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      sessionStorage.setItem(
        'kurio:checkout',
        JSON.stringify({
          userId: 'user-teste',
          quoteId: 'quote-test',
          orderId: id,
          key: 'idem-' + id,
          request: {
            quoteId: 'quote-test',
            collector,
            walletId,
            network: 'ethereum',
            provider: 'metamask',
            walletAddress: wallet.address,
          },
        }),
      )
    })(${JSON.stringify(orderId)})`)

    // Confirma o pedido fora enquanto o usuário está na home
    await page.goto('/')
    await ready(page)

    await page.evaluate(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(orderId)})
      if (order) {
        order.status = 'confirmed'
        order.txHash = '0xA91F' + '0'.repeat(56) + 'E82C'
        order.explorerUrl = 'https://etherscan.io/tx/' + order.txHash
        await ordersStore.put(order)
      }
    })()`)

    // Volta por /pagamento -> redireciona ao recibo confirmado
    await page.goto('/pagamento')
    await expect(page).toHaveURL(new RegExp(`/pedido/${orderId}$`))
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // kurio:checkout foi limpo ali
    const storedCheckout = await page.evaluate(() => sessionStorage.getItem('kurio:checkout'))
    expect(storedCheckout).toBeNull()

    // Recibo antigo aberto durante um pagamento novo não apaga o kurio:checkout novo
    await page.evaluate(`(async () => {
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      sessionStorage.setItem(
        'kurio:checkout',
        JSON.stringify({
          userId: 'user-teste',
          quoteId: 'quote-new',
          orderId: 'new-order-999',
          key: 'idem-new-999',
          request: {
            quoteId: 'quote-new',
            collector,
            walletId,
            network: 'ethereum',
            provider: 'metamask',
            walletAddress: wallet.address,
          },
        }),
      )
    })()`)

    // Navega ao recibo do pedido antigo
    await page.goto(`/pedido/${orderId}`)
    await ready(page)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // kurio:checkout novo não foi apagado
    const checkoutAfterViewingOld = await page.evaluate(() =>
      sessionStorage.getItem('kurio:checkout'),
    )
    expect(checkoutAfterViewingOld).not.toBeNull()
    expect(JSON.parse(checkoutAfterViewingOld ?? '{}')).toMatchObject({
      orderId: 'new-order-999',
    })
  })

  test('4. pagar com MetaMask -> payment-declined -> Tentar novamente -> /pagamento restaura dados, Não conectada e nova chave', async ({
    page,
  }) => {
    await scenarios(page, 'payment-declined')
    await setupSignedInWithCart(page)
    const api = recordApi(page)

    await page.goto('/pagamento')
    await ready(page)

    // Preenche observação do colecionador
    const noteArea = page.getByRole('textbox', { name: /Observações/i })
    if (await noteArea.isVisible()) {
      await noteArea.fill('Entregar com cuidado especial')
    }

    // Seleciona MetaMask
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada:/)).toBeVisible()

    // Confirma compra
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Chega na recusa
    await expect(page).toHaveURL(/\/pedido\/[^/]+$/)
    await expect(
      page.getByText('Pagamento recusado pela carteira simulada.', { exact: true }),
    ).toBeVisible({
      timeout: 10_000,
    })

    // Captura a Idempotency-Key da primeira tentativa
    const firstOrderCall = api.last('POST', '/orders')
    const firstKey = firstOrderCall?.headers['idempotency-key']
    expect(firstKey).toBeDefined()

    // kurio:checkout foi apagado na recusa
    const pendingDuringDeclined = await page.evaluate(() =>
      sessionStorage.getItem('kurio:checkout'),
    )
    expect(pendingDuringDeclined).toBeNull()

    // Clica em "Tentar novamente"
    await page.getByRole('link', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)
    await ready(page)

    // (b) Estado da conexão "Não conectada" com o provedor do rascunho em destaque
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'MetaMask' })).toBeChecked()

    // (a) kurio:checkout continua nulo
    const pendingOnReturn = await page.evaluate(() => sessionStorage.getItem('kurio:checkout'))
    expect(pendingOnReturn).toBeNull()

    // Reconecta a carteira e reenvia
    await page.getByRole('button', { name: 'Conectar' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada:/)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const secondReview = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(secondReview).toBeVisible()
    await secondReview.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Segundo POST /orders usou chave diferente
    await expect.poll(() => api.calls('POST', '/orders').length).toBeGreaterThanOrEqual(2)

    const secondOrderCall = api.calls('POST', '/orders')[1]
    const secondKey = secondOrderCall?.headers['idempotency-key']
    expect(secondKey).toBeDefined()
    expect(secondKey).not.toBe(firstKey)
  })
})
