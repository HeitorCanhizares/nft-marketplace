/// <reference lib="dom" />
import { expect, test, type Locator, type Page } from '@playwright/test'

import { only, openApp } from './helpers.ts'

async function expectActiveDot(hero: Locator, slideNumber: 1 | 2 | 3) {
  for (const num of [1, 2, 3] as const) {
    const dot = hero.getByRole('button', { name: `Ir para o slide ${num}` })
    if (num === slideNumber) {
      await expect(dot).toHaveAttribute('aria-current', 'true')
    } else {
      await expect(dot).not.toHaveAttribute('aria-current', 'true')
    }
  }
}

async function swipeHero(page: Page, direction: 'left' | 'right') {
  await page.evaluate(async (dir) => {
    const root = document.querySelector('[data-slot="carousel-content"]')
    if (!root) throw new Error('Carrossel sem conteúdo')
    const startX = dir === 'left' ? 320 : 60
    const endX = dir === 'left' ? 60 : 320
    const y = 50

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
      // Um quadro entre os movimentos: o Embla calcula a velocidade pelo intervalo entre eventos.
      await new Promise((resolve) => setTimeout(resolve, 16))
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

test.describe('Início — hero: movimento reduzido, controles manuais e CTA Explorar (13-021)', () => {
  test('1. prefers-reduced-motion: sem autoplay e sem botão de pausa; setas e indicadores trocam o slide', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.install()
    await openApp(page)
    await page.clock.runFor(100)

    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible()

    // Sem botão de pausa/retomada e região anunciada como polite (parada).
    await expect(hero.getByRole('button', { name: /rotação dos destaques/i })).toHaveCount(0)
    await expect(hero.getByRole('region')).toHaveAttribute('aria-live', 'polite')
    await expectActiveDot(hero, 1)

    // Sem rotação automática mesmo avançando o relógio.
    await page.clock.runFor(12_000)
    await expectActiveDot(hero, 1)

    // Indicadores continuam funcionando.
    const dot2 = hero.getByRole('button', { name: 'Ir para o slide 2' })
    await dot2.click()
    await expectActiveDot(hero, 2)

    // Setas do teclado com foco no carrossel continuam trocando o slide.
    await dot2.focus()
    await page.keyboard.press('ArrowRight')
    await expectActiveDot(hero, 3)

    await page.keyboard.press('ArrowLeft')
    await expectActiveDot(hero, 2)

    if (testInfo.project.name === 'mobile') {
      // O arrasto do Embla mede o tempo entre os eventos: o relógio volta a correr antes do swipe.
      await page.clock.resume()
      await swipeHero(page, 'left')
      await expectActiveDot(hero, 3)
    }
  })

  test('2. setas (ArrowLeft/ArrowRight) com foco no carrossel e indicadores por teclado trocam o slide', async ({
    page,
  }) => {
    await openApp(page)
    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible()
    await expectActiveDot(hero, 1)

    const dot1 = hero.getByRole('button', { name: 'Ir para o slide 1' })
    await dot1.focus()

    await page.keyboard.press('ArrowRight')
    await expectActiveDot(hero, 2)

    await page.keyboard.press('ArrowRight')
    await expectActiveDot(hero, 3)

    // Loop para a direita volta ao slide 1.
    await page.keyboard.press('ArrowRight')
    await expectActiveDot(hero, 1)

    // Loop para a esquerda vai ao slide 3.
    await page.keyboard.press('ArrowLeft')
    await expectActiveDot(hero, 3)

    // Indicadores acionados por teclado (foco + Enter).
    const dot2 = hero.getByRole('button', { name: 'Ir para o slide 2' })
    await dot2.focus()
    await page.keyboard.press('Enter')
    await expectActiveDot(hero, 2)
  })

  test('2b. [m] swipe horizontal (arrastar) troca o slide no mobile', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await openApp(page)
    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible()
    await expectActiveDot(hero, 1)

    await swipeHero(page, 'left')
    await expectActiveDot(hero, 2)

    await swipeHero(page, 'right')
    await expectActiveDot(hero, 1)
  })

  test('3. "EXPLORAR" leva a #catalogo, atualiza a URL com hash e foca o título do catálogo', async ({
    page,
  }) => {
    await openApp(page)
    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible()

    await hero.getByRole('button', { name: 'EXPLORAR' }).click()

    await expect(page).toHaveURL(/#catalogo$/)
    const catalogHeading = page
      .locator('#catalogo')
      .getByRole('heading', { level: 2, name: 'Catálogo de NFTs' })
    await expect(catalogHeading).toBeFocused()
    await expect(page.locator('#catalogo')).toBeInViewport()
  })
})
