/// <reference lib="dom" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { openApp } from './helpers.ts'

const SLIDE_ALTS = [
  'Macaco de óculos escuros e jaqueta verde',
  'Gorila cinza de capuz roxo e chapéu verde',
  'Macaco laranja com fones de ouvido verdes',
] as const

const HERO_TITLES = {
  desktop: 'SEJA DONO DO FUTURO DA ARTE DIGITAL',
  mobile: 'SEJA DONO DA CULTURA DIGITAL',
} as const

function expectedTitle(testInfo: TestInfo) {
  return testInfo.project.name === 'mobile' ? HERO_TITLES.mobile : HERO_TITLES.desktop
}

async function expectActiveSlide(hero: Locator, slideNumber: 1 | 2 | 3, title: string) {
  await expect(hero.getByRole('heading', { level: 2 })).toHaveText(title)

  for (const num of [1, 2, 3] as const) {
    const dot = hero.getByRole('button', { name: `Ir para o slide ${num}` })
    if (num === slideNumber) {
      await expect(dot).toHaveAttribute('aria-current', 'true')
    } else {
      await expect(dot).not.toHaveAttribute('aria-current', 'true')
    }
  }

  const group = hero.getByRole('group', { name: `Destaque ${slideNumber} de 3` })
  await expect(group.getByRole('img')).toHaveAttribute('alt', SLIDE_ALTS[slideNumber - 1])
}

async function bootHeroWithClock(page: Page) {
  await page.clock.install()
  await openApp(page)
  const hero = page.getByRole('region', { name: 'Destaques' })
  await page.clock.runFor(100)
  await expect(hero).toBeVisible()
  return hero
}

test.describe('Início — hero: rotação automática, loop e pausa (13-020)', () => {
  test('1. rotação a cada 6 s avança até o último slide e volta ao primeiro em loop', async ({
    page,
  }, testInfo) => {
    const hero = await bootHeroWithClock(page)
    const title = expectedTitle(testInfo)
    const carousel = hero.getByRole('region')

    await expect(carousel).toHaveAttribute('aria-live', 'off')
    await expectActiveSlide(hero, 1, title)

    // Antes de completar 6 s, permanece no slide 1.
    await page.clock.runFor(5_000)
    await expectActiveSlide(hero, 1, title)

    // Completa os 6 s: avança para o slide 2.
    await page.clock.runFor(1_100)
    await expectActiveSlide(hero, 2, title)

    // Mais 6 s: avança para o último slide (slide 3).
    await page.clock.runFor(6_000)
    await expectActiveSlide(hero, 3, title)

    // Mais 6 s: volta ao primeiro slide (loop).
    await page.clock.runFor(6_000)
    await expectActiveSlide(hero, 1, title)
  })

  test('2. mouse sobre o hero, foco interno e botão de pausa param a rotação; retoma só sem pausa manual', async ({
    page,
  }, testInfo) => {
    const hero = await bootHeroWithClock(page)
    const title = expectedTitle(testInfo)
    const carousel = hero.getByRole('region')
    const exploreButton = hero.getByRole('button', { name: 'EXPLORAR' })

    await expectActiveSlide(hero, 1, title)

    // 1) Mouse sobre o hero pausa a rotação.
    await hero.hover()
    await expect(carousel).toHaveAttribute('aria-live', 'polite')
    await page.clock.runFor(12_000)
    await expectActiveSlide(hero, 1, title)

    // Soltar o mouse fora do hero retoma a rotação.
    await page.mouse.move(0, 0)
    await expect(carousel).toHaveAttribute('aria-live', 'off')
    await page.clock.runFor(6_000)
    await expectActiveSlide(hero, 2, title)

    // 2) Foco dentro do hero pausa a rotação.
    await exploreButton.focus()
    await expect(carousel).toHaveAttribute('aria-live', 'polite')
    await page.clock.runFor(12_000)
    await expectActiveSlide(hero, 2, title)

    // Tirar o foco do hero retoma a rotação.
    await exploreButton.blur()
    await expect(carousel).toHaveAttribute('aria-live', 'off')
    await page.clock.runFor(6_000)
    await expectActiveSlide(hero, 3, title)

    // 3) Botão "Pausar rotação dos destaques" alterna nome e aria-pressed e mantém pausado.
    const pauseButton = hero.getByRole('button', { name: 'Pausar rotação dos destaques' })
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'false')
    await pauseButton.click()

    const resumeButton = hero.getByRole('button', { name: 'Retomar rotação dos destaques' })
    await expect(resumeButton).toHaveAttribute('aria-pressed', 'true')
    await expect(carousel).toHaveAttribute('aria-live', 'polite')

    // Mesmo tirando o mouse e o foco do hero, a pausa manual impede a rotação.
    await page.mouse.move(0, 0)
    await resumeButton.blur()
    await page.clock.runFor(12_000)
    await expectActiveSlide(hero, 3, title)

    // Entrar e sair com o mouse ou foco durante a pausa manual não retoma a rotação.
    await hero.hover()
    await page.mouse.move(0, 0)
    await exploreButton.focus()
    await exploreButton.blur()
    await page.clock.runFor(12_000)
    await expectActiveSlide(hero, 3, title)

    // Clicar em "Retomar rotação dos destaques" volta o rótulo e retoma o autoplay.
    await resumeButton.click()
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'false')
    await page.mouse.move(0, 0)
    await pauseButton.blur()
    await expect(carousel).toHaveAttribute('aria-live', 'off')

    await page.clock.runFor(6_000)
    await expectActiveSlide(hero, 1, title)
  })
})
