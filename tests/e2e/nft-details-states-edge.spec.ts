/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, ready, scenarios } from './helpers.ts'

const NFT_PATH = '/nft/emerald-ape-042'

function loginScope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

async function swipeCarousel(page: Page, direction: 'left' | 'right') {
  await page.evaluate((dir) => {
    const root = document.querySelector('[data-slot="carousel-content"]')
    if (!root) throw new Error('Carrossel não encontrado')
    const startX = dir === 'left' ? 300 : 50
    const endX = dir === 'left' ? 50 : 300
    const y = 100

    const createTouch = (x: number, target: Element) =>
      new Touch({
        identifier: Date.now(),
        target,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y,
      })

    const t1 = createTouch(startX, root)
    root.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [t1],
        targetTouches: [t1],
        changedTouches: [t1],
        bubbles: true,
        cancelable: true,
      }),
    )

    const steps = 5
    for (let i = 1; i <= steps; i += 1) {
      const x = startX + ((endX - startX) * i) / steps
      const t = createTouch(x, root)
      root.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [t],
          targetTouches: [t],
          changedTouches: [t],
          bubbles: true,
          cancelable: true,
        }),
      )
    }

    const tFinal = createTouch(endX, root)
    root.dispatchEvent(
      new TouchEvent('touchend', {
        touches: [],
        targetTouches: [],
        changedTouches: [tFinal],
        bubbles: true,
        cancelable: true,
      }),
    )
  }, direction)
}

test.describe('Detalhes — estados, avaliações, galeria/zoom e compartilhamento (13-034)', () => {
  test('1. erros de rota (500, rede e offline), skeleton, 404, título do documento, breadcrumbs [d] e foco no h1', async ({
    page,
  }, testInfo) => {
    // 1) server-error:GET /nfts/:id exibe RouteError com "Tentar novamente"
    await scenarios(page, 'server-error:GET /nfts/:id')
    await page.goto(NFT_PATH)
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    // 2) network-error exibe RouteError
    await scenarios(page, 'network-error:GET /nfts/:id')
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()

    // 3) offline exibe RouteError
    await scenarios(page, 'offline')
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    await scenarios(page, '')

    // 4) slow exibe skeleton (aria-busy="true") antes de concluir
    await scenarios(page, 'slow')
    await page.reload()
    await expect(page.locator('#conteudo [aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 10_000,
    })
    await scenarios(page, '')

    // 5) 404 mostra "NFT não encontrado" e título "NFT não encontrado | Kurio"
    await page.goto('/nft/nao-existe')
    await ready(page)
    await expect(page).toHaveTitle('NFT não encontrado | Kurio')
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver o catálogo' })).toBeVisible()

    // 6) Título do documento normal: "<nome> | Kurio"
    await page.goto(NFT_PATH)
    await ready(page)
    await expect(page).toHaveTitle('Emerald Ape #042 | Kurio')

    // 7) Breadcrumb e foco no h1 ao navegar para relacionado (desktop)
    if (testInfo.project.name === 'desktop') {
      const breadcrumb = page.getByRole('navigation', { name: 'Navegação estrutural' })
      await expect(breadcrumb.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
      await expect(breadcrumb.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
        'href',
        '/#catalogo',
      )
      await expect(breadcrumb.getByText('Emerald Ape #042')).toHaveAttribute('aria-current', 'page')

      const relatedSection = page.locator('section', { hasText: 'Mais desta coleção' })
      const relatedCard = relatedSection.getByRole('link', { name: /^Ver / }).first()
      await relatedCard.click()
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    }
  })

  test('2. erro em avaliações e relacionados não quebra a página, avaliações vazias e sessão expirada ao favoritar', async ({
    page,
  }, testInfo) => {
    // 1) Erro em avaliações (server-error:GET /nfts/:id/reviews) não derruba a página
    await scenarios(page, 'server-error:GET /nfts/:id/reviews')
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)

    // O NFT carrega normalmente
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('tab', { name: /^Avaliações/ }).click()
      await expect(
        page.getByRole('heading', { name: 'Não foi possível carregar as avaliações' }),
      ).toBeVisible({ timeout: 10_000 })
    } else {
      await page.getByRole('button', { name: /Ver \d+ avaliações/ }).click()
      await expect(
        page.getByRole('heading', { name: 'Não foi possível carregar as avaliações' }),
      ).toBeVisible({ timeout: 10_000 })
      await page.keyboard.press('Escape')
    }

    // 2) Erro em relacionados (server-error:GET /nfts/:id/related) não derruba a página
    await scenarios(page, 'server-error:GET /nfts/:id/related')
    await page.reload()
    await ready(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(
        page.getByRole('heading', { name: 'Não foi possível carregar os NFTs relacionados' }),
      ).toBeVisible({ timeout: 10_000 })
    }
    await scenarios(page, '')

    // 3) Avaliações vazias mostram "Ainda não há avaliações" no painel e "Sem avaliações" na nota
    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        nft.rating.count = 0
        await mock.stores.nftsStore.put(nft)
      }
      const reviews = await mock.stores.reviewsStore.getByNftId('emerald-ape-042')
      for (const r of reviews) await mock.stores.reviewsStore.delete(r.id)
    })()`)
    await page.reload()
    await ready(page)
    await expect(page.getByText('Sem avaliações').first()).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('tab', { name: /^Avaliações/ }).click()
      await expect(page.getByRole('heading', { name: 'Ainda não há avaliações' })).toBeVisible()
    }

    // 4) Deslogado ao favoritar: redireciona para login e volta ao detalhe após entrar
    await page.goto(NFT_PATH)
    await ready(page)
    const favoriteBtn = page.getByRole('button', { name: /Favoritar/ }).first()
    await favoriteBtn.click()

    await expect(page).toHaveURL(/\/entrar\?redirect=.*nft%2Femerald-ape-042/)
    const form = loginScope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('3. zoom em tela cheia, miniaturas com a mesma foto, navegação por botões e teclado, e swipe no mobile [m]', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)

    let zoomTrigger = page.getByRole('button', { name: 'Ampliar imagem' })

    if (testInfo.project.name === 'desktop') {
      // As 4 miniaturas repetem a mesma foto (src) do próprio NFT
      const mainImg = page.locator('main img').nth(4)
      const expectedSrc = await mainImg.getAttribute('src')
      for (let i = 0; i < 4; i += 1) {
        await expect(page.locator('main img').nth(i)).toHaveAttribute('src', expectedSrc ?? '')
      }

      // Miniatura 2
      const thumb2 = page.getByRole('button', { name: 'Imagem 2 de 4' })
      await thumb2.click()
      await expect(thumb2).toHaveAttribute('aria-current', 'true')

      // Abre zoom
      await zoomTrigger.click()
    } else {
      // Abre zoom no mobile
      zoomTrigger = page.getByRole('button', { name: 'Ampliar imagem 1 de 4' })
      await zoomTrigger.click()
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const counter = dialog.getByText(/Imagem \d de 4/)
    await expect(counter).toBeVisible()

    const nextBtn = dialog.getByRole('button', { name: 'Próxima imagem' })
    const prevBtn = dialog.getByRole('button', { name: 'Imagem anterior' })

    // Navega até o final com botão próximo
    while (await nextBtn.isEnabled()) {
      await nextBtn.click()
    }
    await expect(counter).toHaveText('Imagem 4 de 4')
    await expect(nextBtn).toBeDisabled()

    // Foca o botão anterior para garantir que os eventos de teclado vão para o DialogContent
    await prevBtn.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(counter).toHaveText('Imagem 3 de 4')

    await page.keyboard.press('ArrowLeft')
    await expect(counter).toHaveText('Imagem 2 de 4')

    await page.keyboard.press('ArrowLeft')
    await expect(counter).toHaveText('Imagem 1 de 4')
    await expect(prevBtn).toBeDisabled()

    // Fecha com Escape: o diálogo fecha corretamente
    // (O gatilho abre por state no onClick sem DialogTrigger do Radix, logo não devolve foco)
    await dialog.getByRole('button', { name: 'Fechar' }).focus()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Swipe real no carrossel mobile
    if (testInfo.project.name === 'mobile') {
      const initialTrigger = page.getByRole('button', { name: 'Ampliar imagem 1 de 4' })
      await expect(initialTrigger).toBeVisible()

      await swipeCarousel(page, 'left')
      await expect(page.getByRole('button', { name: 'Ampliar imagem 2 de 4' })).toBeVisible()

      await swipeCarousel(page, 'right')
      await expect(page.getByRole('button', { name: 'Ampliar imagem 1 de 4' })).toBeVisible()
    }
  })

  test('4. links de compartilhar [d], navegação por abas e edições por teclado e prefers-reduced-motion', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)

    // 1) Links de compartilhar (desktop)
    if (testInfo.project.name === 'desktop') {
      const shareSection = page.locator('div', { hasText: 'Compartilhar este NFT:' }).first()
      await expect(shareSection).toBeVisible()

      const linkedin = page.getByRole('link', {
        name: 'Compartilhar no LinkedIn (abre em nova aba)',
      })
      await expect(linkedin).toHaveAttribute('target', '_blank')
      await expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(linkedin).toHaveAttribute(
        'href',
        /linkedin\.com\/sharing\/share-offsite\/\?url=.*%2Fnft%2Femerald-ape-042/,
      )

      const twitter = page.getByRole('link', {
        name: 'Compartilhar no Twitter (abre em nova aba)',
      })
      await expect(twitter).toHaveAttribute('target', '_blank')
      await expect(twitter).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(twitter).toHaveAttribute(
        'href',
        /twitter\.com\/intent\/tweet\?url=.*%2Fnft%2Femerald-ape-042/,
      )

      const emailLink = page.getByRole('link', { name: 'Compartilhar por e-mail' })
      await expect(emailLink).toHaveAttribute(
        'href',
        /^mailto:\?subject=Emerald%20Ape%20%23042&body=.*%2Fnft%2Femerald-ape-042/,
      )

      // 2) Abas por teclado e conteúdo de Detalhes
      const detailsTab = page.getByRole('tab', { name: 'Detalhes do NFT' })
      await expect(detailsTab).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByText('Ethereum')).toBeVisible()
      await expect(page.getByText('5%')).toBeVisible()

      await detailsTab.focus()
      await page.keyboard.press('ArrowRight')
      const reviewsTab = page.getByRole('tab', { name: /^Avaliações/ })
      await expect(reviewsTab).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
    }

    // 3) Grupo de edições por teclado (ArrowRight / Space)
    const radio1 = page.getByRole('radio', { name: /1\/10/ })
    await radio1.focus()
    await page.keyboard.press('Space')
    await expect(radio1).toBeChecked()

    await page.keyboard.press('ArrowRight')
    const radio2 = page.getByRole('radio', { name: /1\/50/ })
    await expect(radio2).toBeFocused()
    await page.keyboard.press('Space')
    await expect(radio2).toBeChecked()

    // 4) prefers-reduced-motion: rola sem erro
    await page.emulateMedia({ reducedMotion: 'reduce' })
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: /Ver 19 avaliações/ }).click()
      await expect(page.getByRole('tab', { name: /^Avaliações/ })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    }
  })
})
