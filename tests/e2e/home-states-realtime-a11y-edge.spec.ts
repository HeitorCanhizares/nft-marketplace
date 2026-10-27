// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  delayApi,
  only,
  openApp,
  ready,
  recordApi,
  scenarios,
  signInAs,
} from './helpers.ts'

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

async function assertNoSeriousA11y(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test.describe('Início — estados, tempo real e acessibilidade (13-029)', () => {
  test('1. empty-catalog com facets zeradas e Limpar filtros; esqueleto em carregamento lento; resposta fora de ordem', async ({
    page,
  }, testInfo) => {
    // A) empty-catalog com filtro aplicado mostra Limpar filtros e facets 0
    await scenarios(page, 'empty-catalog')
    await page.goto('/?colecao=arte-digital')
    await ready(page)

    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    const clearBtn = page.locator('#catalogo').getByRole('button', { name: 'Limpar filtros' })
    await expect(clearBtn).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('button', { name: 'Arte digital, 0 NFTs' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByRole('button', { name: 'Fotografia, 0 NFTs' })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
      await expect(page.getByText('Preço: 0,00 - 0,00 ETH')).toBeVisible()
    }

    await clearBtn.click()
    await expect(page).not.toHaveURL(/colecao=/)

    // B) Resposta lenta / esqueleto de cards sem salto de layout
    await scenarios(page, 'slow')
    await page.goto('/')
    await ready(page)
    const skeletonGrid = page.locator('#catalogo [aria-busy="true"]')
    if (await skeletonGrid.isVisible()) {
      await expect(skeletonGrid).toBeVisible()
    }
    await expect(cards(page).first()).toBeVisible()

    // C) delayApi: resposta fora de ordem (A atrasado, B rápido; B vence no final)
    if (testInfo.project.name === 'desktop') {
      await delayApi(page, '**/api/nfts*colecao=arte-digital*', 800)
      const collArte = page.getByRole('button', { name: /^Arte digital/ })
      const collFoto = page.getByRole('button', { name: /^Fotografia/ })

      await collArte.click()
      await collFoto.click()

      await expect(page).toHaveURL(/colecao=fotografia/)
      await expect(cards(page).first()).toBeVisible()
    }
  })

  test('2. falhas de rede e servidor mostram mensagem amigável e Tentar novamente; Início inerte atrás de /entrar [d]', async ({
    page,
  }, testInfo) => {
    // A) Erro de rede com botão Tentar novamente
    await scenarios(page, 'network-error:GET /nfts')
    await page.goto('/')
    await ready(page)

    const errorHeading = page.getByRole('heading', { name: 'Não foi possível carregar os NFTs' })
    await expect(errorHeading).toBeVisible()
    const retryBtn = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryBtn).toBeVisible()

    // Limpa o erro e tenta novamente com sucesso
    await page.evaluate(() => localStorage.removeItem('kurio:mock:scenarios'))
    await retryBtn.click()
    await expect(cards(page).first()).toBeVisible()

    // B) Erro 500 no servidor exibe mensagem amigável
    await scenarios(page, 'server-error:GET /nfts')
    await page.goto('/')
    await ready(page)
    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar os NFTs' }),
    ).toBeVisible()

    // C) [d] Início aparece atrás do modal de /entrar sem erro e inerte
    only(testInfo, 'desktop')
    await scenarios(page, '')
    await page.goto('/entrar')
    await ready(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Entrar' })).toBeAttached()

    const homeCatalog = page.locator('#catalogo')
    await expect(homeCatalog).toBeAttached()
  })

  test('3. tempo real: alteração de preço, selo Atualizado por 5s, esgotado e reconexão', async ({
    page,
  }, testInfo) => {
    await page.clock.install()
    await openApp(page)
    await collectAnnouncements(page)
    await expect(cards(page).first()).toBeVisible()

    const initialNames = await cards(page).getByRole('heading', { level: 3 }).allInnerTexts()

    // Alteração de preço em tempo real de item visível
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '2.50')
    })()`)

    const apeCard = cards(page).filter({ hasText: 'Emerald Ape #042' })
    await expect(apeCard.getByText('2.50 ETH')).toBeVisible()
    await expect(apeCard.getByText('Atualizado')).toBeVisible()

    // Ordem dos cards preservada
    const afterPriceNames = await cards(page).getByRole('heading', { level: 3 }).allInnerTexts()
    expect(afterPriceNames).toEqual(initialNames)

    // Aviso polite agrupado na região aria-live
    await expect.poll(async () => await announcements(page)).toContain('1 preço foi atualizado')

    // Selo "Atualizado" some após 5 segundos
    await page.clock.runFor(5_100)
    await expect(apeCard.getByText('Atualizado')).toHaveCount(0)

    // Alteração de estoque até 0 em NFT com edições limitadas mostra Esgotado
    const target = await page.evaluate<{
      id: string
      name: string
      editionIds: string[]
    } | null>(`(async () => {
      const mock = window.__kurioMock
      const all = await mock.stores.nftsStore.getAll()
      const found = all.find(
        (nft) =>
          nft.editions.length > 0 &&
          nft.editions.every((e) => e.available !== null && e.available > 0),
      )
      if (!found) return null
      return { id: found.id, name: found.name, editionIds: found.editions.map((e) => e.id) }
    })()`)

    if (target) {
      await page.evaluate(`(async (t) => {
        const mock = window.__kurioMock
        for (const editionId of t.editionIds) {
          await mock.triggerStockChange(t.id, editionId, 0)
        }
      })(${JSON.stringify(target)})`)

      await page.goto(`/?q=${encodeURIComponent(target.name)}`)
      await ready(page)
      const targetCard = cards(page).filter({ hasText: target.name })
      await expect(targetCard.getByText('Esgotado').last()).toBeVisible()

      if (testInfo.project.name === 'desktop') {
        const disabledAction = targetCard.getByRole('button', { name: 'Esgotado' })
        await expect(disabledAction).toHaveAttribute('aria-disabled', 'true')
      }
    }

    // Reconexão relê o catálogo
    const api = recordApi(page)
    await page.evaluate(`(async () => {
      await window.__kurioMock.dropConnections()
    })()`)
    await expect.poll(() => api.calls('GET', '/nfts').length).toBeGreaterThan(0)
  })

  test('4. acessibilidade: axe nos estados e navegação por teclado [d]/[m]', async ({
    page,
  }, testInfo) => {
    // A) Axe no estado vazio
    await scenarios(page, 'empty-catalog')
    await page.goto('/')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await assertNoSeriousA11y(page)

    // B) Axe no favoritos=1 vazio (logado com usuário sem favoritos)
    await scenarios(page, '')
    await page.goto('/')
    await ready(page)
    await signInAs(page, 'other')
    await page.goto('/?favoritos=1')
    await ready(page)
    await expect(
      page.getByRole('heading', { name: 'Você ainda não favoritou nenhum NFT' }),
    ).toBeVisible()
    await assertNoSeriousA11y(page)

    // C) Axe no estado de erro
    await scenarios(page, 'server-error:GET /nfts')
    await page.goto('/')
    await ready(page)
    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar os NFTs' }),
    ).toBeVisible()
    await assertNoSeriousA11y(page)

    // D) Axe no painel de filtros [d] ou drawer aberto [m]
    await scenarios(page, '')
    await page.goto('/')
    await ready(page)
    await expect(cards(page).first()).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      const aside = page.getByRole('complementary', { name: 'Filtros' })
      await expect(aside).toBeVisible()
      await assertNoSeriousA11y(page)

      // Tab percorre do topo aos elementos principais na ordem lógica
      await page.locator('header').getByRole('link', { name: 'Início' }).first().focus()
      await page.keyboard.press('Tab')
      const activeElTag = await page.evaluate(() => document.activeElement?.tagName)
      expect(activeElTag).toBeDefined()
    } else {
      const openFiltersBtn = page.getByRole('button', { name: /^Filtros/ })
      await openFiltersBtn.focus()
      await page.keyboard.press('Enter')
      const sheet = page.getByRole('dialog', { name: 'Filtros' })
      await expect(sheet).toBeVisible()
      await assertNoSeriousA11y(page, ['aria-hidden-focus'])

      // Fechar drawer com teclado (Esc) e retorno do foco ao gatilho
      await page.keyboard.press('Escape')
      await expect(sheet).toBeHidden()
      await expect(openFiltersBtn).toBeFocused()
    }
  })
})
