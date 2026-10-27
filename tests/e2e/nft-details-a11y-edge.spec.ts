/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { announcements, collectAnnouncements, only, openApp, ready, scenarios } from './helpers.ts'

const NFT_PATH = '/nft/emerald-ape-042'

async function expectNoSeriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test.describe('Detalhes — acessibilidade dos estados e modais (13-035)', () => {
  test('1. Axe sem violações graves/críticas: zoom aberto, drawer [m], esgotado, 404 e erro', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)

    // 1) Zoom aberto
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'Ampliar imagem' }).click()
    } else {
      await page.getByRole('button', { name: 'Ampliar imagem 1 de 4' }).click()
    }
    const zoomDialog = page.getByRole('dialog')
    await expect(zoomDialog).toBeVisible()
    await expect(zoomDialog).toHaveCSS('opacity', '1')
    await expectNoSeriousViolations(page, ['aria-hidden-focus'])
    await page.keyboard.press('Escape')
    await expect(zoomDialog).toBeHidden()

    // 2) Drawer de avaliações [m]
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /avaliações/ }).click()
      const drawer = page.getByRole('dialog', { name: /Avaliações de colecionadores/ })
      await expect(drawer).toBeVisible()
      await expect(drawer).toHaveCSS('opacity', '1')
      await drawer.evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))),
      )
      await expectNoSeriousViolations(page, ['aria-hidden-focus'])
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
    }

    // 3) NFT esgotado
    await page.evaluate(`(async () => {
      const mock = window.__kurioMock
      const nft = await mock.stores.nftsStore.get('emerald-ape-042')
      if (nft) {
        for (const ed of nft.editions) ed.available = 0
        nft.soldOut = true
        await mock.stores.nftsStore.put(nft)
      }
    })()`)
    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Esgotado' }).first()).toBeVisible()
    await expectNoSeriousViolations(page)

    // 4) 404
    await page.goto('/nft/nao-existe')
    await ready(page)
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
    await expectNoSeriousViolations(page)

    // 5) Estado de erro
    await scenarios(page, 'server-error:GET /nfts/:id')
    await page.goto(NFT_PATH)
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    await expectNoSeriousViolations(page)
    await scenarios(page, '')
  })

  test('2. [m] anúncio polite "Adicionado ao carrinho" verificado na região aria-live', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await openApp(page)
    await page.goto(NFT_PATH)
    await ready(page)
    await collectAnnouncements(page)

    const addBtn = page.getByRole('button', { name: 'Adicionar ao carrinho' })
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    await expect.poll(async () => announcements(page)).toContain('Adicionado ao carrinho')

    await expect(page.locator('[role="status"][aria-live="polite"]')).toContainText(
      'Adicionado ao carrinho',
    )
  })
})
