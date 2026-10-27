/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  openApp,
  ready,
  recordApi,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

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
  await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()
}

test.describe('Pagamento — revisão com mudanças forçadas (price, sold-out, coupon, fee) (13-074)', () => {
  test('1. price-change-on-checkout: QuoteChangeList mostra valor antigo → novo, exige confirmar de novo e usa nova chave de idempotência; nft:price_changed chega ao app', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'price-change-on-checkout,payment-slow')
    await collectAnnouncements(page)
    await connectMetaMask(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    const api = recordApi(page)
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Mudança de preço detectada: lista de mudanças e solicitação de nova confirmação
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    await expect(review.getByText('Confirme de novo para continuar.')).toBeVisible()
    const changeList = review.getByRole('list', { name: 'Mudanças desde a última cotação' })
    await expect(changeList).toContainText('Preço de Emerald Ape #042: 1.19 ETH → 1.20 ETH')

    // Evento em tempo real nft:price_changed anunciado
    await expect
      .poll(async () => await announcements(page), { timeout: 10_000 })
      .toContain('O preço de Emerald Ape #042 mudou para 1,20 ETH')

    // Segunda confirmação cria o pedido com sucesso
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)

    // Duas chamadas a POST /orders com chaves de idempotência diferentes
    const calls = api.calls('POST', '/orders')
    expect(calls.length).toBe(2)
    const firstKey = calls[0]?.headers['idempotency-key']
    const secondKey = calls[1]?.headers['idempotency-key']
    expect(firstKey).toBeDefined()
    expect(secondKey).toBeDefined()
    expect(firstKey).not.toBe(secondKey)
  })

  test('2. sold-out-on-checkout: aviso no item, opção de remover na revisão; carrinho esvaziado redireciona para /carrinho; nft:stock_changed chega ao app', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openApp(page, 'sold-out-on-checkout,payment-slow')
    await signInAs(page, 'primary')

    // Limpa o carrinho anterior do usuário para ter exatamente 1 item finito
    await page.evaluate(`(async () => {
      const { cartsStore } = window.__kurioMock.stores
      await cartsStore.delete('cart-user-teste')
      const guestId = localStorage.getItem('kurio:guest-cart-id')
      if (guestId) await cartsStore.delete(guestId)
      window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })
    })()`)

    // Adiciona apenas 1 item finito ao carrinho do usuário logado
    await page.evaluate(`(async () => {
      await window.__kurio.http.post('/cart/items', {
        nftId: 'emerald-ape-042',
        editionId: 'emerald-ape-042-1-50',
        quantity: 1,
      })
      window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })
      window.__kurio.queryClient.invalidateQueries({ queryKey: ['quote'] })
    })()`)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await collectAnnouncements(page)
    await connectMetaMask(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Item esgotou: exibe aviso e botão de remoção na revisão
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    const changeList = review.getByRole('list', { name: 'Mudanças desde a última cotação' })
    await expect(changeList).toContainText('Emerald Ape #042 esgotou.')
    const removeBtn = review.getByRole('button', { name: 'Remover Emerald Ape #042' })
    await expect(removeBtn).toBeVisible()

    // Evento em tempo real nft:stock_changed anunciado
    await expect
      .poll(async () => await announcements(page), { timeout: 10_000 })
      .toContain('Emerald Ape #042 esgotou')

    const api = recordApi(page)
    await removeBtn.click()
    await expect
      .poll(async () => {
        const calls = api.calls('DELETE', /\/cart\/items/)
        return calls.length
      })
      .toBeGreaterThanOrEqual(1)

    await expect(review).toBeHidden({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('3. coupon-expires-on-checkout: revisão mostra o desconto removido e nova confirmação conclui o pedido', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openApp(page, 'coupon-expires-on-checkout,payment-slow')
    await seedFigmaCart(page)
    await signInAs(page, 'primary')

    // Aplica cupom KURIO10 antes de abrir o Pagamento
    await page.evaluate(`(async () => {
      await window.__kurio.http.put('/cart/coupon', { code: 'KURIO10' })
      window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })
      window.__kurio.queryClient.invalidateQueries({ queryKey: ['quote'] })
    })()`)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await connectMetaMask(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()
    await expect(review.getByText('KURIO10')).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Cupom expirou durante o checkout: exibe aviso de desconto removido
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    await expect(review.getByText('Confirme de novo para continuar.')).toBeVisible()
    const changeList = review.getByRole('list', { name: 'Mudanças desde a última cotação' })
    await expect(changeList).toContainText('O cupom KURIO10 expirou e o desconto foi removido.')

    // Nova confirmação sem o desconto conclui a compra
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)
  })

  test('4. fee-change-on-checkout: taxa nova na revisão e nova confirmação conclui o pedido', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openCheckout(page, 'fee-change-on-checkout,payment-slow')
    await connectMetaMask(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()
    await expect(review.getByText('0.016 ETH')).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()

    // Mudança de taxa: exibe mudança de 0.016 ETH → 0.017 ETH
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    await expect(review.getByText('Confirme de novo para continuar.')).toBeVisible()
    const changeList = review.getByRole('list', { name: 'Mudanças desde a última cotação' })
    await expect(changeList).toContainText('Taxa de rede: 0.016 ETH → 0.017 ETH')

    // Nova confirmação com a nova taxa conclui a compra
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/ord-[^/]+$/)
  })
})
