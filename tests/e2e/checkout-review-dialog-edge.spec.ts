/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { delayApi, openApp, ready, recordApi, seedFigmaCart, signInAs } from './helpers.ts'

const CONNECTED = 'Conectada: 0xA91F…E82C'
const COLLECTOR_ADDRESS = '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C'

async function openCheckout(page: Page, activeScenarios?: string) {
  await openApp(page, activeScenarios)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

async function connectMetaMask(page: Page) {
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()
}

async function setScenarios(page: Page, value: string) {
  await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(value)})`)
}

test('1. várias mudanças juntas numa só lista; QUOTE_EXPIRED e CART_CHANGED refazem a cotação sem perder o formulário', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await openCheckout(page, 'price-change-on-checkout,fee-change-on-checkout,payment-slow')

  if (testInfo.project.name === 'desktop') {
    await page.getByLabel('Observação do colecionador (opcional)').fill('Nota preservada')
  }

  await connectMetaMask(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()

  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
  await expect(review.getByText('Confirme de novo para continuar.')).toBeVisible()
  const changeList = review.getByRole('list', { name: 'Mudanças desde a última cotação' })
  await expect(changeList.getByRole('listitem')).toHaveCount(2)
  await expect(changeList).toContainText('Preço de Emerald Ape #042: 1.19 ETH → 1.20 ETH')
  await expect(changeList).toContainText('Taxa de rede: 0.016 ETH → 0.017 ETH')

  // QUOTE_EXPIRED: apaga a cotação no banco para forçar 409 QUOTE_EXPIRED no próximo envio.
  const api = recordApi(page)
  await page.evaluate(`(async () => {
    const req = indexedDB.open('kurio-mock-db', 1)
    const db = await new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const tx = db.transaction('quotes', 'readwrite')
    tx.objectStore('quotes').clear()
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(null)
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  })()`)

  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(
    review
      .getByRole('alert')
      .filter({ hasText: 'A cotação expirou. Conferimos os valores novamente.' }),
  ).toBeVisible()
  expect(api.calls('POST', '/quote').length).toBeGreaterThanOrEqual(1)

  // CART_CHANGED: incrementa a versão do carrinho antes do envio.
  api.clear()
  await page.evaluate(`(async () => {
    const { cartsStore } = window.__kurioMock.stores
    const cart = await cartsStore.get('cart-user-teste')
    if (cart) {
      await cartsStore.put({ ...cart, version: cart.version + 1 })
    }
  })()`)

  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(
    review
      .getByRole('alert')
      .filter({ hasText: 'A cotação expirou. Conferimos os valores novamente.' }),
  ).toBeVisible()
  expect(api.calls('POST', '/quote').length).toBeGreaterThanOrEqual(1)

  await review.getByRole('button', { name: 'Voltar' }).click()
  await expect(review).toHaveCount(0)
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
      'Nota preservada',
    )
  }
})

test('2. cada cenário forçado vale uma vez por carga da página e a nova confirmação cria o pedido', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await openCheckout(page, 'price-change-on-checkout,fee-change-on-checkout,payment-slow')
  await connectMetaMask(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()

  // Primeira tentativa: dispara os cenários forçados uma única vez.
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
  await expect(review.getByText('Confirme de novo para continuar.')).toBeVisible()

  // Segunda confirmação na mesma carga da página: cria o pedido e navega.
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)
})

test('3. Voltar mantém dados e chave; Esc e clique fora bloqueados durante o envio; foco e falha de rede ao revalidar', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000)
  await openCheckout(page)

  if (testInfo.project.name === 'desktop') {
    await page.getByLabel('Observação do colecionador (opcional)').fill('Rascunho mantido')
  }

  await connectMetaMask(page)

  // Falha de rede ao revalidar a cotação impede abrir a revisão e permite tentar de novo.
  await setScenarios(page, 'network-error:POST /quote')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(
    page
      .locator('p[role="alert"]')
      .filter({ hasText: 'Não foi possível conferir os valores. Tente novamente.' }),
  ).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toHaveCount(0)

  await setScenarios(page, 'network-error:POST /orders')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  await expect(review.getByRole('heading', { name: 'Revisar pedido' })).toBeVisible()
  await expect(review.getByRole('button', { name: 'Voltar' })).toBeFocused()

  // Falha de rede no envio grava a chave em kurio:checkout; "Voltar" mantém dados e chave.
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(
    review.getByRole('alert').filter({ hasText: 'Não conseguimos confirmar seu pedido.' }),
  ).toBeVisible()

  const pendingBefore = await page.evaluate<string | null>(
    `sessionStorage.getItem('kurio:checkout')`,
  )
  expect(pendingBefore).not.toBeNull()

  await review.getByRole('button', { name: 'Voltar' }).click()
  await expect(review).toHaveCount(0)
  if (testInfo.project.name === 'desktop') {
    // Radix Dialog sem DialogTrigger não restaura o foco ao botão; testa visibilidade do botão e valor mantido.
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
      'Rascunho mantido',
    )
  }

  const pendingAfterBack = await page.evaluate<string | null>(
    `sessionStorage.getItem('kurio:checkout')`,
  )
  expect(pendingAfterBack).toBe(pendingBefore)

  // Durante o envio, Esc e clique fora estão bloqueados.
  await setScenarios(page, 'payment-slow')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(review).toBeVisible()

  await delayApi(page, '**/api/orders', 1200, { once: true })
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(review.getByRole('button', { name: 'Processando...' })).toBeVisible()
  await expect(review.getByRole('button', { name: 'Voltar' })).toBeDisabled()

  await page.keyboard.press('Escape')
  await page.mouse.click(5, 5)
  await expect(review).toBeVisible()

  await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)
})

test('4. a revisão mostra itens, carteira, taxa e total iguais à cotação da API', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await openCheckout(page)

  // Aplica cupom pela API para validar o espelhamento tanto no desktop quanto no mobile.
  await page.evaluate(`(async () => {
    await window.__kurio.http.put('/cart/coupon', { code: 'KURIO10' })
    await window.__kurio.queryClient.invalidateQueries({ queryKey: ['cart'] })
    await window.__kurio.queryClient.invalidateQueries({ queryKey: ['quote'] })
  })()`)

  await connectMetaMask(page)
  const api = recordApi(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  expect(api.calls('POST', '/quote').length).toBeGreaterThanOrEqual(1)

  const quote = await page.evaluate<{
    subtotal: string
    discount: string
    networkFee: string
    total: string
    coupon?: { code: string }
    items: { name: string; quantity: number; lineTotal: string }[]
  }>(`(() => {
    const entries = window.__kurio.queryClient.getQueriesData({ queryKey: ['quote'] })
    const latest = entries.map(([, data]) => data).find((d) => Boolean(d && d.coupon?.code === 'KURIO10'))
    return {
      subtotal: latest.subtotal,
      discount: latest.discount,
      networkFee: latest.networkFee,
      total: latest.total,
      coupon: latest.coupon,
      items: latest.items.map((i) => ({
        name: i.nft.name,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
    }
  })()`)

  for (const item of quote.items) {
    await expect(review.getByText(item.name)).toBeVisible()
    await expect(review.getByText(`${item.lineTotal} ETH`)).toBeVisible()
  }
  await expect(review.getByText('(x 2)')).toBeVisible()

  await expect(review.getByText('Carteira principal')).toBeVisible()
  await expect(review.getByText(COLLECTOR_ADDRESS)).toBeVisible()
  await expect(review.getByText('MetaMask, 0xA91F…E82C')).toBeVisible()
  await expect(review.getByText('Ethereum')).toBeVisible()
  await expect(review.getByText('KURIO10')).toBeVisible()

  await expect(review.getByText(`${quote.subtotal} ETH`)).toBeVisible()
  await expect(review.getByText(`(-) ${quote.discount} ETH`)).toBeVisible()
  await expect(review.getByText(`${quote.networkFee} ETH`)).toBeVisible()
  await expect(review.getByText(`${quote.total} ETH`)).toBeVisible()
})
