/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, OTHER_USER, ready, seedFigmaCart, seedOrder, signInAs, USER } from './helpers.ts'

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

function loginScope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

async function submitLogin(scopeLocator: Locator, email: string, pass: string) {
  await scopeLocator.getByLabel('E-mail').fill(email)
  await scopeLocator.getByLabel('Senha', { exact: true }).fill(pass)
  await scopeLocator.getByRole('button', { name: 'Entrar' }).click()
}

test.describe('Pagamento — sessão expirada no envio e regras do mock de pedidos (13-077)', () => {
  test('1. session-expired-on-checkout e expiração por TTL salvam rascunho, mantêm kurio:checkout e login do mesmo usuário restaura formulário', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page)

    if (testInfo.project.name === 'desktop') {
      await page
        .getByLabel('Observação do colecionador (opcional)')
        .fill('Nota que sobrevive à expiração')
    }

    // 1a. Expiração por TTL enquanto preenche o formulário
    await page.evaluate(`window.__kurio.emitSessionExpired()`)
    await expect(page).toHaveURL(/\/entrar\?redirect=(%2F|\/)pagamento$/)

    const draftAfterTTL = await page.evaluate<string | null>(
      `sessionStorage.getItem('kurio:checkout-draft')`,
    )
    expect(draftAfterTTL).not.toBeNull()

    // Login do MESMO usuário
    const form = loginScope(page, testInfo)
    await submitLogin(form, users.primary.email, users.primary.password)

    await expect(page).toHaveURL(/\/pagamento$/)
    await ready(page)

    // Formulário restaurado
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Nota que sobrevive à expiração',
      )
    }

    // Pede reconexão da carteira (carteira não conectada)
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toHaveCount(0)
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()

    // 1b. session-expired-on-checkout ao enviar o pedido
    await ensureWalletConnected(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'session-expired-on-checkout')`,
    )
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Redireciona para /entrar?redirect=/pagamento
    await expect(page).toHaveURL(/\/entrar\?redirect=(%2F|\/)pagamento$/)

    // kurio:checkout e kurio:checkout-draft permanecem na sessionStorage
    const pendingStored = await page.evaluate<string | null>(
      `sessionStorage.getItem('kurio:checkout')`,
    )
    expect(pendingStored).not.toBeNull()

    const draftStored = await page.evaluate<string | null>(
      `sessionStorage.getItem('kurio:checkout-draft')`,
    )
    expect(draftStored).not.toBeNull()
  })

  test('2. login de outro usuário após expiração descarta tudo via clearPrivateSession', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page)

    if (testInfo.project.name === 'desktop') {
      await page
        .getByLabel('Observação do colecionador (opcional)')
        .fill('Dados privados do primeiro usuário')
    }

    await ensureWalletConnected(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'session-expired-on-checkout')`,
    )
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    await expect(page).toHaveURL(/\/entrar\?redirect=(%2F|\/)pagamento$/)
    expect(
      await page.evaluate<string | null>(`sessionStorage.getItem('kurio:checkout')`),
    ).not.toBeNull()
    expect(
      await page.evaluate<string | null>(`sessionStorage.getItem('kurio:checkout-draft')`),
    ).not.toBeNull()

    // Login de OUTRO usuário
    const form = loginScope(page, testInfo)
    await submitLogin(form, users.other.email, users.other.password)

    // clearPrivateSession é disparado: kurio:checkout e kurio:checkout-draft são apagados
    await expect
      .poll(async () => page.evaluate<string | null>(`sessionStorage.getItem('kurio:checkout')`))
      .toBeNull()

    await expect
      .poll(async () =>
        page.evaluate<string | null>(`sessionStorage.getItem('kurio:checkout-draft')`),
      )
      .toBeNull()
  })

  test('3. regras do mock: GET /orders só do usuário e só pending; mesma chave com corpo diferente devolve erro; snapshot imutável; POST /orders sem Idempotency-Key', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openApp(page, 'payment-slow')
    await seedFigmaCart(page)
    await signInAs(page, 'primary')

    // 3a. GET /orders: só do usuário e só pending
    const userPendingId = await seedOrder(page, { status: 'pending', userId: USER.id })
    await seedOrder(page, { status: 'confirmed', userId: USER.id })
    await seedOrder(page, { status: 'pending', userId: OTHER_USER.id })

    const listResult = await page.evaluate<{ id: string }[]>(`(async () => {
      const res = await window.__kurio.http.get('/orders', { params: { status: 'pending' } })
      return res.data
    })()`)

    expect(listResult).toHaveLength(1)
    expect(listResult[0]?.id).toBe(userPendingId)

    // GET /orders sem status=pending devolve 400 BAD_REQUEST
    const badRequestStatus = await page.evaluate<number>(`(async () => {
      try {
        await window.__kurio.http.get('/orders')
        return 200
      } catch (err) {
        return window.__kurio.toApiError(err).status
      }
    })()`)
    expect(badRequestStatus).toBe(400)

    // 3b. Mesma chave com corpo diferente devolve 422 IDEMPOTENCY_KEY_REUSED
    const idempotencyTest = await page.evaluate<{
      firstStatus: number
      secondStatus: number
      secondCode: string
    }>(`(async () => {
      const quote = (await window.__kurio.http.post('/quote', { network: 'ethereum' })).data
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      const baseBody = {
        quoteId: quote.id,
        collector,
        walletId,
        network: 'ethereum',
        provider: 'metamask',
        walletAddress: wallet.address,
      }
      const diffBody = {
        ...baseBody,
        note: 'Observação diferente para causar colisão de corpo',
      }
      const testKey = 'rule-idem-test-' + crypto.randomUUID()

      const res1 = await window.__kurio.http.post('/orders', baseBody, {
        headers: { 'Idempotency-Key': testKey },
      })
      let secondStatus = 0
      let secondCode = ''
      try {
        await window.__kurio.http.post('/orders', diffBody, {
          headers: { 'Idempotency-Key': testKey },
        })
        secondStatus = 200
      } catch (err) {
        const apiError = window.__kurio.toApiError(err)
        secondStatus = apiError.status
        secondCode = apiError.code
      }
      return { firstStatus: res1.status, secondStatus, secondCode }
    })()`)

    expect(idempotencyTest.firstStatus).toBe(201)
    expect(idempotencyTest.secondStatus).toBe(422)
    expect(idempotencyTest.secondCode).toBe('IDEMPOTENCY_KEY_REUSED')

    // 3c. Snapshot imutável quando o preço muda
    const snapshotTest = await page.evaluate<{
      beforeTotal: string
      afterTotal: string
    }>(`(async () => {
      const quote = (await window.__kurio.http.post('/quote', { network: 'ethereum' })).data
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      const body = {
        quoteId: quote.id,
        collector,
        walletId,
        network: 'ethereum',
        provider: 'metamask',
        walletAddress: wallet.address,
      }
      const res = await window.__kurio.http.post('/orders', body, {
        headers: { 'Idempotency-Key': 'snapshot-test-' + crypto.randomUUID() },
      })
      const orderId = res.data.id
      const beforeTotal = res.data.total

      // Muda o preço de catálogo do NFT
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '99.99')

      const resAfter = await window.__kurio.http.get('/orders/' + orderId)
      return { beforeTotal, afterTotal: resAfter.data.total }
    })()`)

    expect(snapshotTest.afterTotal).toBe(snapshotTest.beforeTotal)

    // 3d. POST /orders sem Idempotency-Key devolve 400 BAD_REQUEST
    const noKeyStatus = await page.evaluate<number>(`(async () => {
      const quote = (await window.__kurio.http.post('/quote', { network: 'ethereum' })).data
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      try {
        await window.__kurio.http.post('/orders', {
          quoteId: quote.id,
          collector,
          walletId,
          network: 'ethereum',
          provider: 'metamask',
          walletAddress: wallet.address,
        })
        return 200
      } catch (err) {
        return window.__kurio.toApiError(err).status
      }
    })()`)

    expect(noKeyStatus).toBe(400)
  })
})
