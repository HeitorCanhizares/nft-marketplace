/// <reference lib="dom" />
import { expect, test, type Locator, type Page } from '@playwright/test'

import { delayApi, openApp, ready, recordApi, seedCart, seedFigmaCart } from './helpers.ts'

function summaryPanel(page: Page): Locator {
  // No desktop e no mobile há duas seções no DOM; filtra a visível que contém o resumo.
  return page.locator('section:visible', { hasText: 'Subtotal' })
}

function groupFor(page: Page, name: string): Locator {
  return page.getByRole('group', { name: new RegExp(`^Quantidade de ${name}`) })
}

function outputFor(page: Page, name: string): Locator {
  return groupFor(page, name).getByRole('status')
}

async function openFigmaCart(page: Page) {
  await openApp(page)
  await seedFigmaCart(page)
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
}

async function setEditionStock(
  page: Page,
  nftId: string,
  editionId: string,
  available: number,
): Promise<void> {
  await page.evaluate(`(async () => {
    const { nftsStore } = window.__kurioMock.stores
    const nft = await nftsStore.get(${JSON.stringify(nftId)})
    if (!nft) return
    nft.editions = nft.editions.map((e) =>
      e.id === ${JSON.stringify(editionId)} ? { ...e, available: ${available} } : e,
    )
    await nftsStore.put(nft)
  })()`)
}

test.describe('Carrinho — quantidade, debounce e estoque (13-040)', () => {
  test('1. "-" desabilitado em 1; "+" desabilitado no limite com "Máximo disponível: N"; edição ABERTA com teto de 99; quantidade otimista e valores com aria-busy', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await seedFigmaCart(page)
    // Limita Violet Nomad a 1 unidade para já abrir no teto do estoque da edição.
    const violetEditionId = await page.evaluate<string>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('violet-nomad-314')
      const editionId = nft.editions[0].id
      nft.editions = nft.editions.map((e, idx) => (idx === 0 ? { ...e, available: 1 } : e))
      await nftsStore.put(nft)
      return editionId
    })()`)
    expect(violetEditionId).toBeTruthy()
    // Adiciona também a edição ABERTA do Emerald Ape no limite de 99 unidades.
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-aberta', quantity: 99 },
    ])

    await page.goto('/carrinho')
    await ready(page)

    // 1) "-" desabilitado quando a quantidade é 1 (Ivory Baron #088 tem quantity = 1).
    const ivoryGroup = groupFor(page, 'Ivory Baron #088')
    await expect(ivoryGroup.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
    await expect(outputFor(page, 'Ivory Baron #088')).toHaveText('1')

    // 2) "+" desabilitado no limite com "Máximo disponível: 1" em Violet Nomad #314.
    const violetGroup = groupFor(page, 'Violet Nomad #314')
    const violetPlus = violetGroup.getByRole('button', { name: 'Aumentar quantidade' })
    await expect(violetPlus).toBeDisabled()
    await expect(violetGroup.getByText('Máximo disponível: 1')).toBeVisible()
    const hintId = await violetPlus.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    await expect(page.locator(`[id="${hintId ?? ''}"]`)).toHaveText('Máximo disponível: 1')

    // 3) Edição ABERTA com teto de 99 ("Máximo por compra: 99" e "+" desabilitado).
    const openGroup = page.getByRole('group', {
      name: 'Quantidade de Emerald Ape #042, edição ABERTA',
    })
    await expect(openGroup.getByRole('status')).toHaveText('99')
    await expect(openGroup.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
    await expect(openGroup.getByText('Máximo por compra: 99')).toBeVisible()

    // 4) Quantidade otimista só em quantity/itemCount e valores monetários com aria-busy até a resposta.
    const limitedGroup = page.getByRole('group', {
      name: 'Quantidade de Emerald Ape #042, edição 1/50',
    })
    const panel = summaryPanel(page)
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('133.27 ETH')

    await delayApi(page, '**/api/cart/items/*', 2_000, { once: true })
    await limitedGroup.getByRole('button', { name: 'Aumentar quantidade' }).click()

    await expect(limitedGroup.getByRole('status')).toHaveText('3')
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('link', { name: 'Carrinho, 104 itens' })).toBeVisible()
    }
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('133.27 ETH')

    // Enquanto o PATCH está em voo (atrasado em 2 s), os valores monetários ficam com aria-busy="true".
    await expect(panel.locator('[aria-busy="true"]')).toBeVisible()
    await expect(panel.getByText('Atualizando valores')).toBeAttached()

    // Quando o PATCH e a cotação terminam, aria-busy sai e os novos valores entram.
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('134.46 ETH')
    await expect(panel.locator('[aria-busy="true"]')).toHaveCount(0)
  })

  test('2. cliques rápidos viram um PATCH com o valor final; clique repetido na lixeira e em "Aplicar" gera uma requisição', async ({
    page,
  }) => {
    await openFigmaCart(page)
    const api = recordApi(page)

    const apeGroup = groupFor(page, 'Emerald Ape #042')
    const plus = apeGroup.getByRole('button', { name: 'Aumentar quantidade' })

    // Três cliques rápidos (2 -> 3 -> 4 -> 5) dentro da janela de ~400 ms.
    await plus.click()
    await plus.click()
    await plus.click()
    await expect(outputFor(page, 'Emerald Ape #042')).toHaveText('5')

    await expect
      .poll(() => api.calls('PATCH', /^\/cart\/items\//).length, { timeout: 5_000 })
      .toBe(1)
    expect(api.last('PATCH', /^\/cart\/items\//)?.body).toEqual({ quantity: 5 })
    await expect(summaryPanel(page).getByText('Subtotal').locator('..')).toContainText('9.13 ETH')

    // Clique repetido na lixeira (disparo duplo no mesmo turno antes de a linha desmontar) gera um único DELETE.
    api.clear()
    await delayApi(page, '**/api/cart/items/*', 300, { once: true })
    const removeViolet = page.getByRole('button', { name: /^Remover Violet Nomad #314/ })
    await removeViolet.evaluate((button: HTMLElement) => {
      button.click()
      button.click()
    })
    await expect(page.getByText('Violet Nomad #314 removido', { exact: true })).toBeVisible()
    expect(api.calls('DELETE', /^\/cart\/items\//)).toHaveLength(1)

    // Clique repetido em "Aplicar" gera um único PUT /cart/coupon.
    api.clear()
    await delayApi(page, '**/api/cart/coupon', 300, { once: true })
    const panel = summaryPanel(page)
    await panel.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
    const applyBtn = panel.getByRole('button', { name: 'Aplicar' })
    await applyBtn.evaluate((button: HTMLElement) => {
      button.click()
      button.click()
    })
    await expect(panel.getByText('Cupom KURIO10 aplicado')).toBeVisible()
    expect(api.calls('PUT', '/cart/coupon')).toHaveLength(1)
  })

  test('3. PATCH com QUANTITY_EXCEEDS_STOCK, SOLD_OUT, 5xx e erro de rede desfaz o valor, avisa e atualiza os dados', async ({
    page,
  }) => {
    await openFigmaCart(page)

    // A) QUANTITY_EXCEEDS_STOCK: reduz o estoque de Emerald Ape (1/50) no banco para 2 e tenta subir para 3.
    await setEditionStock(page, 'emerald-ape-042', 'emerald-ape-042-1-50', 2)
    const apeGroup = groupFor(page, 'Emerald Ape #042')
    await apeGroup.getByRole('button', { name: 'Aumentar quantidade' }).click()

    await expect(page.getByText('Só há 2 unidades disponíveis.')).toBeVisible()
    await expect(outputFor(page, 'Emerald Ape #042')).toHaveText('2')
    await expect(apeGroup.getByText('Máximo disponível: 2')).toBeVisible()
    await expect(apeGroup.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

    // B) SOLD_OUT: zera o estoque de Violet Nomad no banco e tenta aumentar de 1 para 2.
    const violetEditionId = await page.evaluate<string>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('violet-nomad-314')
      return nft.editions[0].id
    })()`)
    await setEditionStock(page, 'violet-nomad-314', violetEditionId, 0)

    const violetGroup = groupFor(page, 'Violet Nomad #314')
    await violetGroup.getByRole('button', { name: 'Aumentar quantidade' }).click()

    await expect(page.getByText('Violet Nomad #314 esgotou.')).toBeVisible()
    await expect(outputFor(page, 'Violet Nomad #314')).toHaveText('1')
    await expect(page.getByText('Esgotado').first()).toBeVisible()

    // C) 5xx (server-error) em Ivory Baron: desfaz para 1 e avisa.
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:PATCH /cart/items/:itemId')`,
    )
    const ivoryGroup = groupFor(page, 'Ivory Baron #088')
    await ivoryGroup.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(
      page.getByText('Não foi possível alterar a quantidade. Tente de novo.'),
    ).toBeVisible()
    await expect(outputFor(page, 'Ivory Baron #088')).toHaveText('1')

    // D) Erro de rede (network-error) em Ivory Baron: desfaz para 1 e avisa.
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'network-error:PATCH /cart/items/:itemId')`,
    )
    await ivoryGroup.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(outputFor(page, 'Ivory Baron #088')).toHaveText('1')
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
  })

  test('4. decimal, zero e negativo são rejeitados pelo mock com 422 via window.__kurio.http', async ({
    page,
  }) => {
    await openFigmaCart(page)

    const results = await page.evaluate<
      { quantity: number; status: number; code: string }[]
    >(`(async () => {
      const cart = (await window.__kurio.http.get('/cart')).data
      const itemId = cart.items[0].id
      const out = []
      for (const quantity of [1.5, 0, -3]) {
        try {
          await window.__kurio.http.patch('/cart/items/' + encodeURIComponent(itemId), { quantity })
          out.push({ quantity, status: 200, code: 'OK' })
        } catch (err) {
          out.push({ quantity, status: err.status, code: err.code })
        }
      }
      return out
    })()`)

    expect(results).toEqual([
      { quantity: 1.5, status: 422, code: 'VALIDATION_ERROR' },
      { quantity: 0, status: 422, code: 'VALIDATION_ERROR' },
      { quantity: -3, status: 422, code: 'VALIDATION_ERROR' },
    ])
    await expect(outputFor(page, 'Emerald Ape #042')).toHaveText('2')
  })
})
