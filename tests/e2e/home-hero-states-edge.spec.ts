/// <reference lib="dom" />
import { expect, test, type Locator } from '@playwright/test'

import { openApp, ready, recordApi } from './helpers.ts'

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  if (result === null) throw new Error('Elemento sem caixa na tela.')
  return result
}

test.describe('Início — hero e destaque: skeleton sem CLS, erro /home e alt das imagens (13-022)', () => {
  test('1. esqueleto do hero com slow tem a mesma altura do conteúdo final (450 px / 190 px, ± 1 px), sem CLS', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    const expectedHeight = isDesktop ? 450 : 190

    await openApp(page, 'slow')

    const skeleton = page.getByRole('status').filter({ hasText: 'Carregando destaques…' })
    await expect(skeleton).toBeVisible()
    const skeletonBox = await box(skeleton)
    expect(Math.abs(skeletonBox.height - expectedHeight)).toBeLessThanOrEqual(1)

    if (isDesktop) {
      const featuredSkeleton = page.getByRole('status').filter({ hasText: 'Carregando destaque…' })
      await expect(featuredSkeleton).toBeVisible()
    }

    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible({ timeout: 10_000 })
    const heroBox = await box(hero)

    expect(Math.abs(heroBox.height - expectedHeight)).toBeLessThanOrEqual(1)
    expect(Math.abs(heroBox.height - skeletonBox.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(heroBox.y - skeletonBox.y)).toBeLessThanOrEqual(1)
  })

  test('2. server-error:GET /home e offline mostram um único ErrorState dos destaques e "Tentar novamente" recupera', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    const api = recordApi(page)

    // 1) server-error:GET /home (as 3 tentativas iniciais do React Query falham; depois o retry manual passa).
    await openApp(page, 'server-error:GET /home')

    const homeError = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar os destaques' })
    await expect(homeError).toBeVisible({ timeout: 10_000 })
    // Um único ErrorState para todo o /home (hero, destaque, promos e blog não duplicam alerta).
    await expect(page.locator('main [role="alert"]')).toHaveCount(1)

    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    const callsBeforeRetry = api.calls('GET', '/home').length
    await homeError.getByRole('button', { name: 'Tentar novamente' }).click()

    await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible()
    expect(api.calls('GET', '/home').length).toBeGreaterThan(callsBeforeRetry)
    if (isDesktop) {
      await expect(page.getByRole('link', { name: /NFT EM DESTAQUE/ })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Diário da Cunhagem' })).toBeVisible()
    }

    // 2) Cenário offline / falha de rede na primeira leva de GET /home.
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'offline')`)
    await page.reload()
    await ready(page)

    await expect(homeError).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar os destaques' }),
    ).toHaveCount(1)

    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    const callsBeforeOfflineRetry = api.calls('GET', '/home').length
    await homeError.getByRole('button', { name: 'Tentar novamente' }).click()

    await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible()
    expect(api.calls('GET', '/home').length).toBeGreaterThan(callsBeforeOfflineRetry)
  })

  test('3. todas as imagens do hero e do destaque têm alt não vazio vindo da API (alt="" só nas decorativas)', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    await openApp(page)

    const hero = page.getByRole('region', { name: 'Destaques' })
    await expect(hero).toBeVisible()

    const apiHome = await page.evaluate<{
      heroAlts: string[]
      featuredAlt: string
    }>(`(async () => {
      const res = await fetch('/api/home')
      const data = await res.json()
      return {
        heroAlts: data.hero.map((item) => item.image.alt),
        featuredAlt: data.featured.image.alt,
      }
    })()`)

    expect(apiHome.heroAlts).toHaveLength(3)
    for (let i = 0; i < apiHome.heroAlts.length; i += 1) {
      const expectedAlt = apiHome.heroAlts[i]
      expect(expectedAlt.trim().length).toBeGreaterThan(0)

      const slide = hero.getByRole('group', { name: `Destaque ${i + 1} de 3` })
      const mainImg = slide.getByRole('img')
      await expect(mainImg).toHaveCount(1)
      await expect(mainImg).toHaveAttribute('alt', expectedAlt)

      // No mobile há uma segunda miniatura puramente decorativa com alt="".
      const allImgsAlt = await slide
        .locator('img')
        .evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
      if (isDesktop) {
        expect(allImgsAlt).toEqual([expectedAlt])
      } else {
        expect(allImgsAlt).toEqual([expectedAlt, ''])
      }
    }

    if (isDesktop) {
      expect(apiHome.featuredAlt.trim().length).toBeGreaterThan(0)
      const featuredLink = page.getByRole('link', { name: /NFT EM DESTAQUE/ })
      await expect(featuredLink).toBeVisible()
      await expect(featuredLink.getByRole('img')).toHaveAttribute('alt', apiHome.featuredAlt)
    }
  })
})
