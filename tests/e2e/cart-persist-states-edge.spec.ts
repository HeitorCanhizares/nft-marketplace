import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import {
  announcements,
  authState,
  collectAnnouncements,
  firstEditionId,
  only,
  openApp,
  ready,
  seedCart,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

function authFormScope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

function summaryPanel(page: Page): Locator {
  // Filtra a seção visível do resumo do pedido (desktop ou mobile).
  return page.locator('section:visible', { hasText: 'Subtotal' })
}

test.describe('Carrinho — mescla no login, isolamento no logout e estados da página (13-045)', () => {
  test('1. visitante com itens faz login: carrinho mesclado, aviso "Ajustamos … ao estoque disponível" quando reduzido e cupom do visitante mantido', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    const violetEdition = await firstEditionId(page, 'violet-nomad-314')
    const ivoryEdition = await firstEditionId(page, 'ivory-baron-088')

    // 1) Prepara um item prévio no carrinho salvo do usuário principal (Ivory Baron ×1, sem cupom).
    await page.evaluate(`(async () => {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(users.primary)}),
      })
      const { session } = await loginRes.json()
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + session.token,
        },
        body: JSON.stringify({
          nftId: 'ivory-baron-088',
          editionId: ${JSON.stringify(ivoryEdition)},
          quantity: 1,
        }),
      })
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token },
      })
    })()`)

    // 2) Visitante adiciona Emerald Ape (1/10, quantity 4) + Violet Nomad ×1 e aplica o cupom KURIO10.
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-10', quantity: 4 },
      { nftId: 'violet-nomad-314', editionId: violetEdition, quantity: 1 },
    ])
    await page.evaluate(`(async () => {
      const cartId = localStorage.getItem('kurio:guest-cart-id')
      await fetch('/api/cart/coupon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Cart-Id': cartId ?? '' },
        body: JSON.stringify({ code: 'KURIO10' }),
      })
      // O estoque de Emerald Ape (1/10) cai para 3 antes do login para provocar redução na mescla.
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.editions = nft.editions.map((e) =>
          e.id === 'emerald-ape-042-1-10' ? { ...e, available: 3 } : e,
        )
        await nftsStore.put(nft)
      }
    })()`)

    // 3) Visitante entra pelo formulário de login com redirect para /carrinho.
    await page.goto('/entrar?redirect=/carrinho')
    await ready(page)
    const form = authFormScope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/carrinho$/)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

    // Aviso de ajuste ao estoque disponível.
    await expect(page.getByText('Ajustamos o seu carrinho')).toBeVisible()
    await expect(
      page.getByText(
        'Ajustamos Emerald Ape #042 (1/10) de 4 para 3 unidades, o estoque disponível.',
      ),
    ).toBeVisible()

    // Carrinho mesclado: Ivory Baron (do usuário) + Emerald Ape ajustado para 3 + Violet Nomad (do visitante).
    await expect(page.getByRole('button', { name: /^Remover Ivory Baron #088/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Violet Nomad #314/ })).toBeVisible()
    const apeGroup = page.getByRole('group', {
      name: 'Quantidade de Emerald Ape #042, edição 1/10',
    })
    await expect(apeGroup.getByRole('status')).toHaveText('3')

    // Cupom do visitante (KURIO10) mantido no carrinho mesclado.
    await expect(summaryPanel(page).getByText('Cupom KURIO10 aplicado')).toBeVisible()
  })

  test('2. logout abre carrinho de visitante novo; troca de usuário não vaza itens; contador em unidades com anúncio discreto', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await seedFigmaCart(page)
    await signInAs(page, 'primary')
    await page.goto('/carrinho')
    await ready(page)
    await collectAnnouncements(page)

    // Contador no cabeçalho em unidades: 2 (Emerald Ape) + 1 (Violet) + 1 (Ivory) = 4 itens (desktop).
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Carrinho, 4 itens')).toBeVisible()
    }

    // Remover 1 linha de 1 unidade atualiza o contador para 3 unidades e emite anúncio polite discreto.
    await page.getByRole('button', { name: /^Remover Ivory Baron #088/ }).click()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Carrinho, 3 itens')).toBeVisible()
    }
    await expect
      .poll(async () => await announcements(page))
      .toContain('Ivory Baron #088 removido do carrinho')

    // Logout limpa a sessão privada e abre um carrinho de visitante novo (vazio).
    await page.evaluate(`window.__kurio.auth.signOut()`)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Carrinho')).toBeVisible()
    }
    await expect.poll(async () => await announcements(page)).toContain('Você saiu da sua conta')

    // Login com outro usuário (users.other): não vaza os itens de users.primary.
    await signInAs(page, 'other')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toHaveCount(0)
  })

  test('3. server-error:GET /cart e network-error mostram ErrorState com "Tentar novamente"; slow mostra skeleton; empty-cart mostra EmptyState; session-expired volta ao carrinho após login', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await seedFigmaCart(page)

    // 1) server-error:GET /cart -> ErrorState com "Tentar novamente".
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'server-error:GET /cart')`)
    await page.goto('/carrinho')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible({
      timeout: 6_000,
    })
    const retryBtn = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryBtn).toBeVisible()

    // 2) Troca para network-error:GET /cart e tenta de novo -> continua em ErrorState.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'network-error:GET /cart')`)
    await retryBtn.click()
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible({
      timeout: 6_000,
    })
    // Espera o botão voltar do estado "Tentando novamente…"
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    // Limpa o erro e clica em "Tentar novamente" -> carrega o carrinho.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()

    // 3) slow -> exibe CartSkeleton (aria-busy="true") antes de concluir.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'slow')`)
    await page.reload()
    // Seletor CSS necessário para verificar o container aria-busy="true" do CartSkeleton.
    await expect(page.locator('#conteudo [aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible({
      timeout: 10_000,
    })
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)

    // 4) empty-cart -> EmptyState com "Seu carrinho está vazio" e link "Explorar NFTs".
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'empty-cart')`)
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    const exploreLink = page.getByRole('link', { name: 'Explorar NFTs' })
    await expect(exploreLink).toBeVisible()
    await expect(exploreLink).toHaveAttribute('href', '/#catalogo')
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)

    // 5) session-expired -> avisa, redireciona para /entrar?redirect=/carrinho e volta ao carrinho após login.
    await page.reload()
    await ready(page)
    await signInAs(page, 'primary')
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()

    // Expira a sessão salva no banco e dispara uma leitura do carrinho para acionar SESSION_EXPIRED.
    await page.evaluate(`(async () => {
      const raw = localStorage.getItem('kurio:session')
      if (!raw) return
      const { token } = JSON.parse(raw)
      const { sessionsStore } = window.__kurioMock.stores
      const session = await sessionsStore.get(token)
      if (session) {
        await sessionsStore.put({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
      }
      try {
        await window.__kurio.http.get('/cart')
      } catch {
        // O erro 401 SESSION_EXPIRED aciona emitSessionExpired() no interceptor do axios.
      }
    })()`)

    await expect(page).toHaveURL(/\/entrar\?redirect=.*carrinho/)
    const form = authFormScope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
  })

  test('4a. erro em recomendações não derruba a página; título do documento e foco no h1 ao entrar em /carrinho', async ({
    page,
  }, testInfo) => {
    await openApp(page, 'server-error:GET /nfts/recommendations')
    await seedFigmaCart(page)
    await page.evaluate(
      `window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })`,
    )

    // Navega pela aplicação para /carrinho para acionar useRouteFocus (título e foco no h1).
    await page.evaluate(`window.__kurio.router.navigate({ to: '/carrinho' })`)
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page).toHaveTitle('Carrinho | Kurio')

    const h1 = page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })
    await expect(h1).toBeFocused()

    // Mesmo com falha em /nfts/recommendations, os itens e o resumo do carrinho funcionam normalmente.
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    await expect(summaryPanel(page).getByText('Subtotal').locator('..')).toContainText('5.56 ETH')

    if (testInfo.project.name === 'desktop') {
      await expect(
        page.getByRole('heading', { name: 'Não foi possível carregar os NFTs relacionados' }),
      ).toBeVisible({ timeout: 6_000 })
    }
  })

  test('4b. [d] recomendações sem os NFTs que já estão no carrinho', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await openApp(page)
    await seedFigmaCart(page)
    await page.goto('/carrinho')
    await ready(page)

    const carouselSection = page.getByRole('region', { name: 'Colecionadores também viram' })
    await expect(carouselSection).toBeVisible()
    // Espera os cards do carrossel renderizarem.
    await expect(carouselSection.getByRole('link').first()).toBeVisible()

    // Os 3 NFTs do carrinho (Emerald Ape #042, Violet Nomad #314, Ivory Baron #088) não aparecem nas recomendações.
    await expect(carouselSection.getByRole('link', { name: 'Emerald Ape #042' })).toHaveCount(0)
    await expect(carouselSection.getByRole('link', { name: 'Violet Nomad #314' })).toHaveCount(0)
    await expect(carouselSection.getByRole('link', { name: 'Ivory Baron #088' })).toHaveCount(0)
  })
})
