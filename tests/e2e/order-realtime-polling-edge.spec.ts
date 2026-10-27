/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  ready,
  recordApi,
  scenarios,
  seedFigmaCart,
  seedOrder,
  signInAs,
  useHandler,
} from './helpers.ts'

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

test.describe('13-081: Confirmação — queda do socket (realtime-drop), polling de 2 s e aviso de 60 s', () => {
  test('1. realtime-drop: socket cai com pedido pendente, polling de 2 s assume, releitura ao reconectar e sem polling conectado', async ({
    page,
  }) => {
    await scenarios(page, 'realtime-drop,payment-slow')
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    const orderId = await seedOrder(page, { status: 'pending' })
    const api = recordApi(page)

    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    // O socket caiu com realtime-drop (janela de 6 s); o polling de 2 s assume enquanto desconectado
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()

    // Confere que houve múltiplas chamadas GET /orders/:id pelo polling (mínimo 2 chamadas nos 6 s de queda)
    await expect
      .poll(() => api.calls('GET', `/orders/${orderId}`).length, { timeout: 8_000 })
      .toBeGreaterThanOrEqual(2)

    // Aguarda a reconexão automática do socket (após os 6 s do realtime-drop)
    await expect
      .poll(
        async () => {
          return page.evaluate<boolean>(`(() => {
            return window.__kurio?.socket?.isSocketConnected() ?? false
          })()`)
        },
        { timeout: 10_000 },
      )
      .toBe(true)

    const countAtReconnect = api.calls('GET', `/orders/${orderId}`).length

    // Com o socket reconectado, o polling é desativado; a contagem não deve disparar em loop
    await expect
      .poll(() => api.calls('GET', `/orders/${orderId}`).length, { timeout: 3_000 })
      .toBeLessThanOrEqual(countAtReconnect + 1)
  })

  test('2. order:updated de outro pedido é ignorado; evento perdido durante queda é recuperado pela releitura', async ({
    page,
  }) => {
    await scenarios(page, 'payment-slow')
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    const orderId = await seedOrder(page, { status: 'pending' })
    const api = recordApi(page)

    await page.goto(`/pedido/${orderId}`)
    await ready(page)
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()

    const initialCalls = api.calls('GET', `/orders/${orderId}`).length

    // Simula evento order:updated para outro ID arbitrário: deve ser ignorado sem disparar refetch
    await page.evaluate(`(() => {
      const socket = window.__kurio?.socket
      if (socket) {
        window.dispatchEvent(
          new CustomEvent('test:ignore-order', { detail: { orderId: 'outro-pedido-999' } }),
        )
      }
    })()`)

    // Nenhuma nova chamada para nosso pedido
    expect(api.calls('GET', `/orders/${orderId}`).length).toBe(initialCalls)

    // Simula queda de conexão do socket
    await page.evaluate(`(() => {
      window.__kurioMock.dropConnections(5000)
    })()`)

    // Enquanto fora, o pedido é confirmado no mock db (o evento em tempo real é perdido pelo socket fora)
    await page.evaluate(`(async (id) => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(id)
      if (order) {
        order.status = 'confirmed'
        order.txHash = '0xA91F' + '0'.repeat(56) + 'E82C'
        order.explorerUrl = 'https://etherscan.io/tx/' + order.txHash
        await ordersStore.put(order)
      }
    })(${JSON.stringify(orderId)})`)

    // O socket reconecta ou o polling descobre o desfecho atualizado
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 12_000,
    })
  })

  test('3. payment-slow com createdAt antigo: aviso de 60 s aparece quando pendente, some ao sair de pending e botão voltar ao início', async ({
    page,
  }) => {
    await scenarios(page, 'payment-slow')
    await setupSignedInWithCart(page)
    await ensureSeedOrderStock(page)

    const orderId = await seedOrder(page, { status: 'pending' })
    const oldCreatedAt = new Date(Date.now() - 61_000).toISOString()

    const baseOrder = await page.evaluate<Record<string, unknown>>(`(async (id) => {
      const res = await window.__kurio.http.get('/orders/' + id)
      return res.data
    })(${JSON.stringify(orderId)})`)

    // Registra handler MSW para entregar status pending com createdAt antigo ao frontend
    // sem disparar liquidação prematura no mock backend (reportado como app/mock bug)
    await useHandler(
      page,
      `
      worker.use(
        http.get('*/api/orders/${orderId}', () => {
          return HttpResponse.json(${JSON.stringify({
            ...baseOrder,
            status: 'pending',
            createdAt: oldCreatedAt,
          })})
        })
      )
    `,
    )

    await page.evaluate(
      `void window.__kurio.router.navigate({ to: '/pedido/$orderId', params: { orderId: ${JSON.stringify(orderId)} } })`,
    )
    await ready(page)

    // Aviso de demora > 60 s visível
    const slowNotice = page.getByText(
      'Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado.',
    )
    await expect(slowNotice).toBeVisible()

    // Botão Voltar ao início visível
    const homeBtn = page.getByRole('link', { name: 'Voltar ao início' })
    await expect(homeBtn).toBeVisible()

    // Reseta handlers MSW e liquida o pedido para confirmed no mock
    await useHandler(page, `worker.resetHandlers()`)
    await page.evaluate(`(async () => {
      const id = ${JSON.stringify(orderId)}
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(id)
      if (order) {
        order.status = 'confirmed'
        order.txHash = '0xA91F' + '0'.repeat(56) + 'E82C'
        order.explorerUrl = 'https://etherscan.io/tx/' + order.txHash
        await ordersStore.put(order)
      }
      await window.__kurio.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.orders.detail(id),
      })
    })()`)

    // Ao sair de pending, o aviso de demora some e o recibo aparece
    await expect(slowNotice).toHaveCount(0)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 10_000,
    })
  })
})
