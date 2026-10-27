import { expect, test, type Page } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import {
  authState,
  delayApi,
  failApi,
  firstEditionId,
  openApp,
  ready,
  seedFigmaCart,
} from '../e2e/helpers.ts'

const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'))
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            }),
      ),
    )
  })
  await page.mouse.move(0, 0)
}

test.describe('Início — estados visuais', () => {
  test('Início vazio (empty-catalog)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, 'empty-catalog')
    await expect(
      page.getByRole('heading', { level: 3, name: 'Nenhum NFT encontrado' }),
    ).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-vazio.png', { ...SHOT, fullPage: true })
  })

  test('Início erro (server-error:GET /nfts)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, 'server-error:GET /nfts')
    await expect(
      page.getByRole('heading', { level: 3, name: 'Não foi possível carregar os NFTs' }),
    ).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-erro.png', { ...SHOT, fullPage: true })
  })

  test('Início carregando (slow, esqueletos)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await delayApi(page, '**/api/nfts*', 20000)
    await page.goto('/')
    await ready(page)
    await expect(page.locator('#catalogo [data-slot="skeleton"]').first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-carregando.png', { ...SHOT, fullPage: true })
  })

  test('Início drawer de filtros aberto [m]', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await page.getByRole('button', { name: /^Filtros/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await expect(sheet).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-filtros-drawer.png', SHOT)
  })

  test('Início favoritos vazio', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.other)})`)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await page.goto('/?favoritos=1')
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 3, name: 'Você ainda não favoritou nenhum NFT' }),
    ).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-favoritos-vazio.png', { ...SHOT, fullPage: true })
  })

  test('Início 320 px [m]', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'só no projeto mobile')
    await page.setViewportSize({ width: 320, height: 640 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible()
    await expect(page.locator('#catalogo').getByRole('heading', { level: 3 }).first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio-320.png', { ...SHOT, fullPage: true })
  })
})

test.describe('Detalhes — estados visuais', () => {
  test('Detalhes NFT esgotado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await page.evaluate(`(async () => {
      const nft = await window.__kurioMock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        const soldOutEditions = nft.editions.map((e) => ({ ...e, available: 0 }))
        await window.__kurioMock.stores.nftsStore.put({ ...nft, editions: soldOutEditions })
      }
    })()`)
    await page.goto('/nft/emerald-ape-042')
    await ready(page)
    await expect(page.getByText('Esgotado').first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhes-esgotado.png', { ...SHOT, fullPage: true })
  })

  test('Detalhes 404', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/nft/nft-inexistente-404')
    await ready(page)
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhes-404.png', { ...SHOT, fullPage: true })
  })

  test('Detalhes erro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await failApi(page, '**/api/nfts/emerald-ape-042', 500)
    await page.goto('/nft/emerald-ape-042')
    await ready(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Algo deu errado' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhes-erro.png', { ...SHOT, fullPage: true })
  })
})

test.describe('Carrinho — estados visuais', () => {
  test('Carrinho vazio', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/carrinho')
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Seu carrinho está vazio' }),
    ).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho-vazio.png', { ...SHOT, fullPage: true })
  })

  test('Carrinho com item esgotado e aviso de preço', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await seedFigmaCart(page)
    await page.goto('/carrinho')
    await ready(page)
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    const violetEditionId = await firstEditionId(page, 'violet-nomad-314')
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('violet-nomad-314', ${JSON.stringify(violetEditionId)}, 0)
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '1.49')
    })()`)
    await expect(page.getByText('Esgotado').first()).toBeVisible()
    await expect(page.getByText('Preço atualizado: 1.19 ETH → 1.49 ETH')).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho-esgotado-aviso-preco.png', {
      ...SHOT,
      fullPage: true,
    })
  })

  test('Carrinho erro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await failApi(page, '**/api/cart*', 500)
    await page.goto('/carrinho')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho-erro.png', { ...SHOT, fullPage: true })
  })
})
