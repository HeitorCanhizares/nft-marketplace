/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { openApp, ready, recordApi, seedFigmaCart, signInAs, USER } from './helpers.ts'

const CONNECTED = 'Conectada: 0xA91F…E82C'

async function openCheckout(page: Page, activeScenarios?: string) {
  await openApp(page, activeScenarios)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

async function ensureWalletConnected(page: Page) {
  const connected = page.locator('#conteudo').getByText(CONNECTED)
  if (await connected.isVisible().catch(() => false)) return

  const radio = page.getByRole('radio', { name: 'MetaMask' })
  const isChecked = await radio.isChecked().catch(() => false)
  if (isChecked) {
    const reconnectBtn = page.getByRole('button', { name: 'Conectar' })
    if (await reconnectBtn.isVisible().catch(() => false)) {
      await reconnectBtn.click()
    } else {
      await page.evaluate(`window.__kurio.wallet.connect('metamask', 'ethereum')`)
    }
  } else {
    await radio.click()
  }
  await expect(connected).toBeVisible()
}

test.describe('Pagamento — envio idempotente, order-timeout, retentativa e recusa de assinatura (13-076)', () => {
  test('1a. clique repetido em "Confirmar compra" e em "Confirmar e pagar" cria um único pedido', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'payment-slow')
    await ensureWalletConnected(page)

    const api = recordApi(page)

    // Clique duplo / repetido em "Confirmar compra"
    const confirmButton = page.getByRole('button', { name: 'Confirmar compra' })
    await confirmButton.click({ clickCount: 2 })

    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // Clique duplo / repetido em "Confirmar e pagar"
    const payButton = review.getByRole('button', { name: 'Confirmar e pagar' })
    await payButton.click({ clickCount: 2 })

    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)

    // Apenas uma chamada a POST /orders foi enviada e um único pedido gravado
    expect(api.calls('POST', '/orders')).toHaveLength(1)
    const ordersCount = await page.evaluate<number>(
      `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId(${JSON.stringify(USER.id)})).length)()`,
    )
    expect(ordersCount).toBe(1)
  })

  test('1b. order-timeout exibe "Confirmando seu pedido..." e conclui sem duplicar', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'order-timeout,payment-slow')
    await ensureWalletConnected(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    const api = recordApi(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Primeira tentativa estourou timeout no cliente; segunda exibe "Confirmando seu pedido..."
    await expect(review.getByRole('button', { name: 'Confirmando seu pedido...' })).toBeVisible({
      timeout: 20_000,
    })

    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/, { timeout: 25_000 })

    // Dois envios foram feitos usando exatamente a mesma chave de idempotência
    const calls = api.calls('POST', '/orders')
    expect(calls).toHaveLength(2)
    const firstKey = calls[0]?.headers['idempotency-key']
    const secondKey = calls[1]?.headers['idempotency-key']
    expect(firstKey).toBeDefined()
    expect(firstKey).toBe(secondKey)
    expect(calls[0]?.body).toEqual(calls[1]?.body)

    const ordersCount = await page.evaluate<number>(
      `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId(${JSON.stringify(USER.id)})).length)()`,
    )
    expect(ordersCount).toBe(1)
  })

  test('2. falha de rede faz 3 tentativas, exibe "Não conseguimos confirmar seu pedido." e tentar novamente reutiliza a chave sem nova assinatura', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openCheckout(page)
    await ensureWalletConnected(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // Força falha de rede no envio
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'network-error:POST /orders')`,
    )

    const api = recordApi(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    await expect(
      review.getByRole('alert').filter({ hasText: 'Não conseguimos confirmar seu pedido.' }),
    ).toBeVisible({ timeout: 15_000 })

    // Três tentativas foram disparadas
    const failedCalls = api.calls('POST', '/orders')
    expect(failedCalls).toHaveLength(3)
    const firstKey = failedCalls[0]?.headers['idempotency-key']
    expect(firstKey).toBeDefined()
    expect(failedCalls[1]?.headers['idempotency-key']).toBe(firstKey)
    expect(failedCalls[2]?.headers['idempotency-key']).toBe(firstKey)

    // Remove erro e ativa wallet-sign-rejected: se tentar assinar de novo, falharia
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'payment-slow,wallet-sign-rejected')`,
    )
    api.clear()

    // Clica em "Confirmar e pagar" novamente (reatentativa reutilizando a chave)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)

    const retryCalls = api.calls('POST', '/orders')
    expect(retryCalls).toHaveLength(1)
    expect(retryCalls[0]?.headers['idempotency-key']).toBe(firstKey)
  })

  test('3. 422 IDEMPOTENCY_KEY_REUSED e 422 VALIDATION_ERROR mostram mensagem e mantêm o formulário', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page)

    if (testInfo.project.name === 'desktop') {
      await page.getByLabel('Observação do colecionador (opcional)').fill('Nota preservada no 422')
    }

    await ensureWalletConnected(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // Injeta registro na objectStore idempotency com a quoteId atual do cache, chave customizada e corpo diferente
    await page.evaluate(`(async () => {
      const entries = window.__kurio.queryClient.getQueriesData({ queryKey: ['quote'] })
      let currentQuoteId = ''
      for (let i = entries.length - 1; i >= 0; i--) {
        const data = entries[i]?.[1]
        if (data && typeof data === 'object' && 'id' in data && typeof data.id === 'string') {
          currentQuoteId = data.id
          break
        }
      }
      if (!currentQuoteId) throw new Error('Quote não encontrada no cache')

      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      const request = {
        quoteId: currentQuoteId,
        collector,
        walletId,
        network: 'ethereum',
        provider: 'metamask',
        walletAddress: wallet.address,
      }

      const req = indexedDB.open('kurio-mock-db', 1)
      const db = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

      const tx = db.transaction('idempotency', 'readwrite')
      tx.objectStore('idempotency').put({
        key: 'idem-key-collision',
        bodyHash: 'hash-antigo-diferente',
        orderId: 'ord-dummy',
        createdAt: new Date().toISOString(),
      })
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(null)
        tx.onerror = () => reject(tx.error)
      })
      db.close()

      sessionStorage.setItem('kurio:checkout', JSON.stringify({
        userId: ${JSON.stringify(USER.id)},
        quoteId: currentQuoteId,
        key: 'idem-key-collision',
        request,
      }))
    })()`)

    // Envia com a chave conflitante: recebe 422 IDEMPOTENCY_KEY_REUSED
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      review
        .getByRole('alert')
        .filter({ hasText: 'Esta requisição já foi enviada com outros dados.' }),
    ).toBeVisible()

    await review.getByRole('button', { name: 'Voltar' }).click()
    await expect(review).toHaveCount(0)

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Nota preservada no 422',
      )
    }

    // 422 VALIDATION_ERROR via cenário forçado
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'validation-error:POST /orders')`,
    )
    await page.evaluate(`sessionStorage.removeItem('kurio:checkout')`)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      review.getByRole('alert').filter({ hasText: 'Revise os dados informados.' }),
    ).toBeVisible()

    await review.getByRole('button', { name: 'Voltar' }).click()
    await expect(review).toHaveCount(0)

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Nota preservada no 422',
      )
    }
  })

  test('4. wallet-sign-rejected, desconexão durante assinatura e refresh com pedido pendente preservam carrinho e formulário', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'wallet-sign-rejected')

    if (testInfo.project.name === 'desktop') {
      await page
        .getByLabel('Observação do colecionador (opcional)')
        .fill('Nota para teste de assinatura')
    }

    await ensureWalletConnected(page)
    const api = recordApi(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    // 4a. wallet-sign-rejected: mensagem "Pagamento cancelado na carteira", nenhum pedido enviado
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      review.getByRole('alert').filter({ hasText: 'Pagamento cancelado na carteira' }),
    ).toBeVisible()

    expect(api.calls('POST', '/orders')).toHaveLength(0)
    const ordersCount = await page.evaluate<number>(
      `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId(${JSON.stringify(USER.id)})).length)()`,
    )
    expect(ordersCount).toBe(0)

    // 4b. Desconexão durante a assinatura
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await page.evaluate(`window.__kurio.wallet.disconnect()`)

    await expect(
      review.getByRole('alert').filter({ hasText: 'Carteira desconectada. Conecte novamente.' }),
    ).toBeVisible()

    await review.getByRole('button', { name: 'Voltar' }).click()
    await expect(review).toHaveCount(0)

    // Carrinho e formulário preservados
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Nota para teste de assinatura',
      )
    }
    const cartItemsCount = await page.evaluate<number>(
      `(async () => (await window.__kurio.http.get('/cart')).data.items.length)()`,
    )
    expect(cartItemsCount).toBe(3)

    // 4c. Refresh no meio do envio recupera o pedido pelo GET /orders?status=pending
    await ensureWalletConnected(page)
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'payment-slow')`)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Aguarda o pedido ser gravado no banco pelo mock
    await expect
      .poll(async () =>
        page.evaluate<number>(
          `(async () => (await window.__kurioMock.stores.ordersStore.listByUserId(${JSON.stringify(USER.id)})).length)()`,
        ),
      )
      .toBe(1)

    // Recarrega no meio do envio
    await page.reload()
    await ready(page)

    // A guarda recupera pelo GET /orders?status=pending e navega para /pedido/<id>
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)
  })
})
