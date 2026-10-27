/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { only, ready, seedFigmaCart } from './helpers.ts'

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

    function isClippedByAncestorOverflow(el: HTMLElement, innerWidth: number): boolean {
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
      if (isClippedByAncestorOverflow(el, innerWidth)) continue

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

type RouteConfig = {
  path: string
  label: string
  setup?: (page: Page) => Promise<void>
}

const PUBLIC_ROUTES: readonly RouteConfig[] = [
  { path: '/', label: 'Início (/)' },
  { path: '/nft/emerald-ape-042', label: 'Detalhe do NFT (/nft/emerald-ape-042)' },
  {
    path: '/carrinho',
    label: 'Carrinho com itens (/carrinho)',
    setup: async (page) => {
      await page.goto('/')
      await ready(page)
      await seedFigmaCart(page)
    },
  },
  { path: '/entrar', label: 'Login (/entrar)' },
  { path: '/cadastro', label: 'Cadastro (/cadastro)' },
  { path: '/rota-inexistente-404', label: 'Página 404 (/rota-inexistente-404)' },
] as const

test.describe('13-090 — Reflow, zoom 200 % e diálogos nas rotas públicas e de compra', () => {
  for (const route of PUBLIC_ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route.label} em ${vp.name}: sem overflow horizontal e foco dentro da tela`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        if (route.setup) {
          await route.setup(page)
        }
        await page.goto(route.path)
        await ready(page)
        await checkReflow(page)
      })
    }
  }

  test('[d] AuthDialog no desktop em 1440x500: sem overflow horizontal e rola por dentro', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await page.setViewportSize({ width: 1440, height: 500 })
    await page.goto('/cadastro')
    await ready(page)

    const dialog = page.getByRole('dialog')
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

    const submit = dialog.getByRole('button', { name: 'Criar conta', exact: true })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
  })

  for (const vp of VIEWPORTS) {
    test(`Zoom de imagem em /nft/emerald-ape-042 em ${vp.name}: sem overflow e rolagem interna`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/nft/emerald-ape-042')
      await ready(page)

      const zoomTrigger = page.getByRole('button', { name: /Ampliar imagem/ })
      await expect(zoomTrigger.first()).toBeVisible()
      await zoomTrigger.first().click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const metrics = await dialog.evaluate((el) => ({
        hasHorizontalOverflow: el.scrollWidth > el.clientWidth,
        fitsWidth: el.getBoundingClientRect().width <= window.innerWidth,
      }))
      expect(metrics.hasHorizontalOverflow).toBe(false)
      expect(metrics.fitsWidth).toBe(true)

      await checkReflow(page)

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    })
  }
})
