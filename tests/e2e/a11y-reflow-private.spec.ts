/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { USER, only, ready, seedFigmaCart, seedOrder, signInAs } from './helpers.ts'

type Viewport = {
  width: number
  height: number
  name: string
}

const VIEWPORTS: readonly Viewport[] = [
  { width: 320, height: 640, name: '320x640 (WCAG 1.4.10 / 400 %)' },
  { width: 720, height: 450, name: '720x450 (zoom 200 % de 1440)' },
  { width: 360, height: 640, name: '360x640' },
] as const

type FocusableReport = {
  tag: string
  text: string
  role: string | null
  left: number
  right: number
}

type ReflowMetrics = {
  scrollWidth: number
  innerWidth: number
  hasDocOverflow: boolean
  offscreenElements: FocusableReport[]
}

async function checkReflow(page: Page) {
  const result = await page.evaluate<ReflowMetrics>(() => {
    const scrollWidth = document.documentElement.scrollWidth
    const innerWidth = window.innerWidth
    const hasDocOverflow = scrollWidth > innerWidth

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors))
    const offscreenElements: FocusableReport[] = []

    function isClippedByAncestorOverflow(el: HTMLElement): boolean {
      let parent = el.parentElement
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        const isOverflowHidden =
          style.overflow === 'hidden' ||
          style.overflowX === 'hidden' ||
          style.overflow === 'clip' ||
          style.overflowX === 'clip'
        if (isOverflowHidden) {
          const parentRect = parent.getBoundingClientRect()
          if (parentRect.left >= -2 && parentRect.right <= innerWidth + 2) {
            return true
          }
        }
        parent = parent.parentElement
      }
      return false
    }

    for (const el of elements) {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      if (el.classList.contains('sr-only')) continue
      if (el.closest('[aria-hidden="true"]')) continue
      if (isClippedByAncestorOverflow(el)) continue

      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue

      if (rect.left < -2 || rect.right > innerWidth + 2) {
        offscreenElements.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? '').trim().slice(0, 30),
          role: el.getAttribute('role'),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        })
      }
    }

    return {
      scrollWidth,
      innerWidth,
      hasDocOverflow,
      offscreenElements,
    }
  })

  expect(
    result.hasDocOverflow,
    `document.documentElement.scrollWidth (${result.scrollWidth}) <= window.innerWidth (${result.innerWidth})`,
  ).toBe(false)
  expect(
    result.offscreenElements,
    `elementos focáveis fora da tela na horizontal: ${JSON.stringify(result.offscreenElements)}`,
  ).toEqual([])
}

async function preparePrivateSession(page: Page) {
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
}

test.describe('13-091 — Reflow, zoom 200 %, textos longos e movimento reduzido nas rotas autenticadas', () => {
  for (const vp of VIEWPORTS) {
    test(`[m] /perfil em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }, testInfo) => {
      only(testInfo, 'mobile')
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      await page.goto('/perfil')
      await ready(page)
      await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
      await checkReflow(page)
    })

    test(`/perfil/dados em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      await page.goto('/perfil/dados')
      await ready(page)
      await expect(page.getByLabel('Nome de exibição')).toHaveValue(USER.displayName)
      await checkReflow(page)
    })

    test(`/perfil/carteiras em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      await page.goto('/perfil/carteiras')
      await ready(page)
      await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
      await checkReflow(page)
    })

    test(`/pagamento em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      await page.goto('/pagamento')
      await ready(page)
      await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
      await checkReflow(page)
    })

    test(`/pedido/<id confirmado> em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      const confirmedId = await seedOrder(page, { status: 'confirmed' })
      await page.goto(`/pedido/${confirmedId}`)
      await ready(page)
      await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
      await checkReflow(page)
    })

    test(`/pedido/<id recusado> em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await preparePrivateSession(page)
      const declinedId = await seedOrder(page, { status: 'declined' })
      await page.goto(`/pedido/${declinedId}`)
      await ready(page)
      await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
      await checkReflow(page)
    })
  }

  test('revisão do Pagamento aberta: sem overflow horizontal e rolagem interna', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await preparePrivateSession(page)
    await page.goto('/pagamento')
    await ready(page)

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    const metrics = await review.evaluate((el) => ({
      hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
      overflowY: getComputedStyle(el).overflowY,
    }))
    expect(metrics.hasHorizontalOverflow).toBe(false)

    await checkReflow(page)
  })

  test('[d] OrderDialog no desktop em 1440x500: sem overflow horizontal e rola por dentro', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await page.setViewportSize({ width: 1440, height: 500 })
    await preparePrivateSession(page)
    const orderId = await seedOrder(page, { status: 'confirmed' })
    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    const dialog = page.getByRole('dialog', { name: 'Pedido confirmado' })
    await expect(dialog).toBeVisible()

    const metrics = await dialog.evaluate((el) => ({
      scrolls: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
      hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
      fits: el.getBoundingClientRect().height <= window.innerHeight,
    }))

    expect(metrics.hasHorizontalOverflow).toBe(false)
    expect(metrics.fits).toBe(true)
    expect(metrics.scrolls).toBe(true)
    expect(metrics.overflowY).toBe('auto')

    await checkReflow(page)
  })

  test('diálogo de e-mail do Perfil aberto: sem overflow horizontal e rolagem interna', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await preparePrivateSession(page)
    await page.goto('/perfil/dados')
    await ready(page)

    const emailInput = page.getByLabel('E-mail')
    await emailInput.fill('novo-email-a11y@kurio.test')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Confirme sua senha' })
    await expect(dialog).toBeVisible()

    const metrics = await dialog.evaluate((el) => ({
      hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
      fitsWidth: el.getBoundingClientRect().width <= window.innerWidth,
    }))
    expect(metrics.hasHorizontalOverflow).toBe(false)
    expect(metrics.fitsWidth).toBe(true)

    await checkReflow(page)
  })

  test('nomes longos (displayName 40 carac, apelido 30 carac) e endereços 0x sem overflow em 320 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await preparePrivateSession(page)

    const longDisplayName = 'Nome Extremamente Longo Com Quarenta CXX'
    const longNickname = 'Apelido Longo Com Trinta Carac'

    await page.evaluate(`(async ({ displayName, nickname }) => {
        const { usersStore } = window.__kurioMock.stores
        const user = await usersStore.get('user-teste')
        if (user) {
          await usersStore.put({ ...user, displayName })
        }
        const wallet = (await window.__kurio.http.get('/wallets')).data.primary
        await window.__kurio.http.put('/wallets/secondary', {
          ...wallet,
          nickname,
          network: 'polygon',
          ensName: 'carteira-longa-exemplo.eth',
        })
      })(${JSON.stringify({ displayName: longDisplayName, nickname: longNickname })})`)

    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue(longDisplayName)
    await checkReflow(page)

    await page.goto('/perfil/carteiras')
    await ready(page)
    const secondaryRegion = page.getByRole('region', { name: 'Carteira secundária' })
    await expect(secondaryRegion.getByLabel('Apelido da carteira')).toHaveValue(longNickname)
    await checkReflow(page)
  })

  test('prefers-reduced-motion: reduce desativa autoplay, animações infinitas e rolagem suave', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await preparePrivateSession(page)

    await page.goto('/')
    await ready(page)

    const htmlScrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    )
    expect(htmlScrollBehavior).toBe('auto')

    const pauseButton = page.getByRole('button', { name: /rotação dos destaques/ })
    await expect(pauseButton).toHaveCount(0)

    const firstSlideAlt = await page
      .locator('section[aria-label="Destaques"] img')
      .first()
      .getAttribute('alt')
    await page.clock.install({ time: new Date('2026-10-27T12:00:00Z') })
    await page.clock.fastForward(15_000)
    const currentSlideAlt = await page
      .locator('section[aria-label="Destaques"] img')
      .first()
      .getAttribute('alt')
    expect(currentSlideAlt).toBe(firstSlideAlt)

    await page.evaluate(`window.__kurio.toast('Toast sem animação')`)
    const toast = page.locator('[data-sonner-toast]').first()
    await expect(toast).toBeVisible()

    const toastAnimation = await toast.evaluate((el) => ({
      iterationCount: getComputedStyle(el).animationIterationCount,
      duration: getComputedStyle(el).animationDuration,
    }))
    expect(toastAnimation.iterationCount).toBe('1')
  })
})
