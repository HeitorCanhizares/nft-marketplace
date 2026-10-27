// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { announcements, collectAnnouncements, only, openApp, ready, recordApi } from './helpers.ts'

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

test.describe('Início — Catálogo: paginação numérica e Carregar mais', () => {
  test('1. [m] "Carregar mais" acumula até pageSize 300, esconde no fim, preserva o scroll e recupera de erro na 2ª chamada', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    const api = recordApi(page)
    await openApp(page)
    await collectAnnouncements(page)

    await expect(cards(page)).toHaveCount(9)
    expect(api.last('GET', '/nfts')?.query).toMatchObject({ page: '1', pageSize: '9' })

    const loadMore = page.getByRole('button', { name: 'Carregar mais' })
    await loadMore.scrollIntoViewIfNeeded()
    const scrollBefore = await page.evaluate<number>('window.scrollY')
    expect(scrollBefore).toBeGreaterThan(0)

    // Falha na 2ª chamada: mantém os 9 cards durante a tentativa (placeholderData) e depois permite tentar novamente
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'server-error:GET /nfts')`)
    await loadMore.click()

    // Enquanto tenta carregar a próxima página, os 9 cards continuam na tela
    await expect(cards(page)).toHaveCount(9)

    // Após esgotar as tentativas automáticas, exibe ErrorState com "Tentar novamente"
    const retryBtn = page.locator('#catalogo').getByRole('button', { name: 'Tentar novamente' })
    await expect(retryBtn).toBeVisible({ timeout: 5_000 })
    await expect(
      page.locator('#catalogo').getByRole('heading', { name: 'Não foi possível carregar os NFTs' }),
    ).toBeVisible()

    // Limpa o erro e clica em "Tentar novamente": conclui o carregamento dos 18 cards sem voltar ao topo
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await retryBtn.click()
    await expect(cards(page)).toHaveCount(18)
    expect(api.last('GET', '/nfts')?.query).toMatchObject({ page: '1', pageSize: '18' })

    const scrollAfter = await page.evaluate<number>('window.scrollY')
    expect(scrollAfter).toBeGreaterThan(0)
    await expect(cards(page).nth(9).getByRole('link')).toBeFocused()
    expect(await announcements(page)).toContain('Mostrando 18 de 283 NFTs')

    // Ao atingir o fim da lista e o limite máximo de 300 em pageSize, esconde o botão "Carregar mais"
    api.clear()
    await page.goto('/?pagina=40')
    await ready(page)
    await expect.poll(() => api.last('GET', '/nfts')?.query.pageSize).toBe('300')
    await expect(cards(page)).toHaveCount(283)
    await expect(page.getByRole('button', { name: 'Carregar mais' })).toHaveCount(0)
  })

  test('2. [d] paginação numérica move o foco ao título, posiciona #catalogo na tela sem voltar ao topo e controla Anterior/Próxima nas pontas', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    const api = recordApi(page)
    await openApp(page)
    await collectAnnouncements(page)

    const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
    await expect(pagination).toBeVisible()

    // Na página 1: "Página 1" ativa, sem "Página anterior", com "Próxima página"
    await expect(pagination.getByRole('link', { name: 'Página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(pagination.getByRole('link', { name: 'Página anterior' })).toHaveCount(0)
    await expect(pagination.getByRole('link', { name: 'Próxima página' })).toBeVisible()

    // Troca para a página 2: foco vai ao h2 do catálogo e #catalogo fica posicionado na tela (scrollY > 0)
    await pagination.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/pagina=2/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.page).toBe('2')
    await expect(
      page.locator('#catalogo').getByRole('heading', { level: 2, name: 'Catálogo de NFTs' }),
    ).toBeFocused()

    await expect.poll(() => page.evaluate<number>('window.scrollY')).toBeGreaterThan(200)
    await expect(pagination.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(pagination.getByRole('link', { name: 'Página anterior' })).toBeVisible()
    await expect(pagination.getByRole('link', { name: 'Próxima página' })).toBeVisible()
    await expect.poll(async () => (await announcements(page)).includes('Página 2 de 32')).toBe(true)

    // Vai para a última página (32): "Próxima página" não é exibida na ponta final
    await pagination.getByRole('link', { name: 'Página 32' }).click()
    await expect(page).toHaveURL(/pagina=32/)
    await expect(pagination.getByRole('link', { name: 'Página 32' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(pagination.getByRole('link', { name: 'Próxima página' })).toHaveCount(0)
    await expect(pagination.getByRole('link', { name: 'Página anterior' })).toBeVisible()
    await expect.poll(() => page.evaluate<number>('window.scrollY')).toBeGreaterThan(200)

    // Página acima do total corrige para a última página (replace)
    await page.goto('/?pagina=999')
    await ready(page)
    await expect(page).toHaveURL(/pagina=32/)
  })
})
