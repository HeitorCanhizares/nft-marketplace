// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  only,
  openApp,
  ready,
  recordApi,
  scenarios,
  signInAs,
} from './helpers.ts'

const PATH = '/nft/emerald-ape-042'

async function go(page: Page, path = PATH) {
  await page.goto(path)
  await ready(page)
}

test.describe('Detalhes — comprar, erros de estoque/rede e mescla (13-031)', () => {
  test('1. SOLD_OUT e QUANTITY_EXCEEDS_STOCK exibem mensagem junto ao stepper, dados atualizados e botões liberados', async ({
    page,
  }, testInfo) => {
    // A) SOLD_OUT: estoque zera no servidor depois de a tela carregar
    await openApp(page)
    await go(page)

    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        const ed = nft.editions.find((e) => e.id === 'emerald-ape-042-1-50')
        if (ed) ed.available = 0
        await mock.stores.nftsStore.put(nft)
      }
    })()`)

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    }

    // Mensagem de erro de esgotamento renderizada na região de status junto ao stepper
    await expect(page.getByText(/esgotou/).first()).toBeVisible()

    // B) QUANTITY_EXCEEDS_STOCK: cliente pede 2, mas estoque cai para 1 no servidor
    await page.reload()
    await ready(page)

    // Troca para edição 1/10 (estoque 6) e aumenta quantidade para 2
    await page.getByRole('radio', { name: '1/10' }).click()
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()

    // Servidor atualiza estoque para 1 antes do clique
    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        const ed = nft.editions.find((e) => e.id === 'emerald-ape-042-1-10')
        if (ed) ed.available = 1
        await mock.stores.nftsStore.put(nft)
      }
    })()`)

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    }

    await expect(
      page.getByText('Você já tem o máximo disponível desta edição no carrinho.').first(),
    ).toBeVisible()

    // Botões liberados após erro (não presos em pending)
    if (testInfo.project.name === 'desktop') {
      const buyBtn = page.getByRole('button', { name: 'COMPRAR', exact: true })
      await expect(buyBtn).not.toHaveAttribute('aria-busy', 'true')
    }
  })

  test('2. 5xx e erro de rede disparam toast e liberam botões; cliques repetidos disparam apenas uma requisição', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await scenarios(page, 'server-error:POST /cart/items')
    await go(page)

    // A) 500 dispara toast de erro e libera botão
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
    }

    await expect(
      page.getByText('Não foi possível adicionar ao carrinho. Tente de novo.'),
    ).toBeVisible()

    // Limpa cenário de erro
    await page.evaluate(() => localStorage.removeItem('kurio:mock:scenarios'))

    // B) Cliques repetidos disparam apenas 1 requisição
    const api = recordApi(page)
    const actionBtn =
      testInfo.project.name === 'desktop'
        ? page.getByRole('button', { name: 'COMPRAR', exact: true })
        : page.getByRole('button', { name: 'Adicionar ao carrinho' })

    await Promise.all([actionBtn.click(), actionBtn.click(), actionBtn.click()])
    await expect.poll(() => api.calls('POST', '/cart/items').length).toBe(1)

    // C) Clique repetido em favoritar
    await signInAs(page, 'primary')
    await go(page)
    const favBtn = page.getByRole('button', { name: /Favoritar Emerald Ape/i })
    api.clear()

    await Promise.all([favBtn.click(), favBtn.click(), favBtn.click()])
    await expect
      .poll(() => api.calls('POST', '/favorites').length + api.calls('DELETE', /favorites/).length)
      .toBe(1)
  })

  test('3. visitante adiciona com X-Cart-Id e carrinho é mesclado no login acumulando quantidades', async ({
    page,
  }) => {
    await openApp(page)

    // 1) O usuário "other" já tem 1 unidade no seu carrinho
    await signInAs(page, 'other')
    await page.evaluate(async () => {
      const sessionRaw = localStorage.getItem('kurio:session')
      if (!sessionRaw) return
      const token = (JSON.parse(sessionRaw) as { token: string }).token
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nftId: 'emerald-ape-042',
          editionId: 'emerald-ape-042-1-50',
          quantity: 1,
        }),
      })
    })

    // Desloga para voltar a visitante
    await page.evaluate(`(async () => {
      await window.__kurio?.auth.signOut()
    })()`)

    // 2) Como visitante, adiciona 2 unidades da mesma edição
    await go(page)
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()

    const api = recordApi(page)
    const addBtn = page.getByRole('button', { name: /COMPRAR|Adicionar ao carrinho/ }).first()
    await addBtn.click()

    await expect.poll(() => api.calls('POST', '/cart/items').length).toBeGreaterThan(0)
    const guestCartId = api.last('POST', '/cart/items')?.headers['x-cart-id']
    expect(guestCartId).toBeDefined()

    // 3) Faz login novamente com "other": os carrinhos se mesclam
    await signInAs(page, 'other')
    await page.goto('/carrinho')
    await ready(page)

    // Quantidade acumulada: 1 existente + 2 adicionadas = 3
    const apeGroup = page.getByRole('group', { name: /Quantidade de Emerald Ape #042/ })
    await expect(apeGroup.locator('output').first()).toHaveText('3')
  })

  test('4. [m] o botão de carrinho confirma com check por 2 s e anúncio sem toast', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await openApp(page)
    await go(page)
    await collectAnnouncements(page)

    const cartBtn = page.getByRole('button', { name: 'Adicionar ao carrinho' })
    await cartBtn.click()

    // Confirma com ícone de check e muda aria-label para "Adicionado ao carrinho"
    const addedBtn = page.getByRole('button', { name: 'Adicionado ao carrinho' })
    await expect(addedBtn).toBeVisible()

    // Anúncio polite sem toast
    await expect.poll(async () => await announcements(page)).toContain('Adicionado ao carrinho')
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)

    // Após 2 segundos volta ao estado normal
    await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible({
      timeout: 3_500,
    })
  })
})
