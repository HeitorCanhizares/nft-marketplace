import { expect, test, type Page } from '@playwright/test'

import {
  openApp,
  ready,
  recordApi,
  scenarios,
  seedCart,
  seedFigmaCart,
  seedOrder,
  signInAs,
  USER,
} from './helpers.ts'

async function signInWithFigmaCart(page: Page) {
  await openApp(page)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
}

async function buildPendingPayload(page: Page, key: string, orderId?: string) {
  return page.evaluate<{
    userId: string
    quoteId: string
    key: string
    request: Record<string, unknown>
    orderId?: string
  }>(`(async () => {
    const quote = (await window.__kurio.http.post('/quote', { network: 'ethereum' })).data
    const wallet = (await window.__kurio.http.get('/wallets')).data.primary
    const { id: walletId, slot, ...collector } = wallet
    const request = {
      quoteId: quote.id,
      collector,
      walletId,
      network: 'ethereum',
      provider: 'metamask',
      walletAddress: wallet.address,
    }
    const pending = {
      userId: ${JSON.stringify(USER.id)},
      quoteId: quote.id,
      key: ${JSON.stringify(key)},
      request,
      ...(${JSON.stringify(orderId)} ? { orderId: ${JSON.stringify(orderId)} } : {}),
    }
    sessionStorage.setItem('kurio:checkout', JSON.stringify(pending))
    return pending
  })()`)
}

test.describe('Pagamento — guardas de entrada, pedido pendente e erros de carga (13-070)', () => {
  test('1a. visitante sem login é redirecionado para /entrar?redirect=/pagamento', async ({
    page,
  }) => {
    await openApp(page)
    await seedFigmaCart(page)

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/entrar\?redirect=(%2F|\/)pagamento$/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe('/pagamento')
  })

  test('1b. carrinho com item esgotado, estoque insuficiente ou empty-cart redireciona para /carrinho com o motivo', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    // 1) Item esgotado -> /carrinho com "Remova os itens esgotados para continuar."
    await openApp(page)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 2 },
    ])
    await signInAs(page, 'primary')
    await page.evaluate(
      `window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-50', 0)`,
    )

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Remova os itens esgotados para continuar.').first()).toBeVisible()

    // 2) Estoque insuficiente (quantidade 2, disponível 1) -> /carrinho com "Ajuste as quantidades acima do estoque para continuar."
    await page.evaluate(
      `window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-50', 1)`,
    )
    await page.evaluate(
      `window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })`,
    )

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(
      page.getByText('Ajuste as quantidades acima do estoque para continuar.').first(),
    ).toBeVisible()

    // 3) Cenário empty-cart -> /carrinho com "Seu carrinho está vazio."
    await page.evaluate(
      `window.__kurioMock.triggerStockChange('emerald-ape-042', 'emerald-ape-042-1-50', 20)`,
    )
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'empty-cart')`)
    await page.evaluate(
      `window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })`,
    )

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Seu carrinho está vazio.').first()).toBeVisible()
  })

  test('2a. pedido pendente por kurio:checkout.orderId e por GET /orders?status=pending redireciona a /pedido/<id>', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await scenarios(page, 'payment-slow')
    await signInWithFigmaCart(page)

    // 1) Por kurio:checkout.orderId na sessionStorage (mesmo sem pendente na lista da API).
    const confirmedId = await seedOrder(page, { status: 'confirmed' })
    await buildPendingPayload(page, 'idem-local-order-id', confirmedId)

    await page.goto('/pagamento')
    await expect(page).toHaveURL(new RegExp(`/pedido/${confirmedId}$`))

    // 2) Por GET /orders?status=pending (sem kurio:checkout na sessionStorage).
    await page.evaluate(`sessionStorage.removeItem('kurio:checkout')`)
    const pendingId = await seedOrder(page, { status: 'pending' })

    await page.goto('/pagamento')
    await expect(page).toHaveURL(new RegExp(`/pedido/${pendingId}$`))
  })

  test('2b. chave de idempotência sem orderId reenvia POST /orders com a mesma chave e o mesmo corpo (pedido não existe e pedido já existe)', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await scenarios(page, 'payment-slow')
    await signInWithFigmaCart(page)

    const api = recordApi(page)

    // Caso A: o pedido ainda não existe no servidor -> POST /orders cria o pedido com a mesma chave e o mesmo corpo e abre /pedido/<id>.
    const pendingNew = await buildPendingPayload(page, 'idem-key-new-order')
    api.clear()

    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)

    const firstCalls = api.calls('POST', '/orders')
    expect(firstCalls).toHaveLength(1)
    expect(firstCalls[0].headers['idempotency-key']).toBe('idem-key-new-order')
    expect(firstCalls[0].body).toEqual(pendingNew.request)

    const createdOrderId = page.url().split('/pedido/')[1]
    const storedAfterNew = await page.evaluate<{ orderId?: string } | null>(
      `JSON.parse(sessionStorage.getItem('kurio:checkout') ?? 'null')`,
    )
    expect(storedAfterNew?.orderId).toBe(createdOrderId)

    // Caso B: o pedido já existe na idempotencyStore (status confirmed para GET /orders?status=pending devolver []),
    // mas sessionStorage['kurio:checkout'] ficou sem orderId -> POST /orders reenvia a mesma chave e o mesmo corpo e recebe o pedido existente sem duplicar.
    await page.evaluate(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const existing = await ordersStore.get(${JSON.stringify(createdOrderId)})
      if (existing) {
        await ordersStore.put({ ...existing, status: 'confirmed', txHash: '0x' + 'a'.repeat(64) })
      }
      const raw = JSON.parse(sessionStorage.getItem('kurio:checkout'))
      delete raw.orderId
      sessionStorage.setItem('kurio:checkout', JSON.stringify(raw))
    })()`)
    api.clear()

    await page.goto('/pagamento')
    await expect(page).toHaveURL(new RegExp(`/pedido/${createdOrderId}$`))

    const secondCalls = api.calls('POST', '/orders')
    expect(secondCalls).toHaveLength(1)
    expect(secondCalls[0].headers['idempotency-key']).toBe('idem-key-new-order')
    expect(secondCalls[0].body).toEqual(pendingNew.request)

    const totalOrders = await page.evaluate<number>(
      `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId(${JSON.stringify(USER.id)})).length)()`,
    )
    expect(totalOrders).toBe(1)
  })

  test('3. server-error em carrinho, carteiras ou pendentes exibe ErrorState com "Tentar novamente" e recupera ao tentar de novo', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await signInWithFigmaCart(page)

    for (const route of ['GET /cart', 'GET /wallets', 'GET /orders'] as const) {
      await page.goto('/')
      await ready(page)
      await page.evaluate(
        `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(`server-error:${route}`)})`,
      )
      await page.evaluate(`(() => {
        const k = window.__kurio
        k.queryClient.removeQueries({ queryKey: k.queryKeys.cart })
        k.queryClient.removeQueries({ queryKey: k.queryKeys.wallets })
        k.queryClient.removeQueries({ queryKey: k.queryKeys.orders.pending })
      })()`)

      await page.goto('/pagamento')
      await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible({
        timeout: 15_000,
      })
      const retryButton = page.getByRole('button', { name: 'Tentar novamente' })
      await expect(retryButton).toBeVisible()

      await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
      await retryButton.click()
      await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible({
        timeout: 15_000,
      })
    }
  })
})
