/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { openApp, ready, recordApi } from './helpers.ts'

const SEARCH_KEYS = [
  'q',
  'aba',
  'colecao',
  'rede',
  'precoMin',
  'precoMax',
  'ordem',
  'pagina',
  'favoritos',
] as const

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

async function cardTitles(page: Page): Promise<string[]> {
  return cards(page).getByRole('heading', { level: 3 }).allInnerTexts()
}

test.describe('Início — catálogo: persistência na URL, histórico e normalização de parâmetros (13-024)', () => {
  test('1. refresh restaura filtros, ordem, aba e página; voltar/avançar restauram cada passo (busca mobile e Carregar mais usam replace)', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)
    const step0Titles = await cardTitles(page)

    if (isDesktop) {
      const aside = page.getByRole('complementary', { name: 'Filtros' })

      // Passo 1: filtro de coleção.
      await aside.getByRole('button', { name: /^Música, \d+ NFTs$/ }).click()
      await expect(page).toHaveURL(/colecao=musica/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.collection).toBe('musica')

      // Passo 2: aba.
      await page.getByRole('tab', { name: 'Em alta' }).click()
      await expect(page).toHaveURL(/aba=em-alta/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.tab).toBe('trending')

      // Passo 3: ordenação.
      await page.getByRole('combobox', { name: 'Ordenar por' }).click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
      await expect(page).toHaveURL(/ordem=menor-preco/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.sort).toBe('price_asc')
      await expect(cards(page)).toHaveCount(9)
      const step3Titles = await cardTitles(page)

      // Passo 4: página 2.
      await page.getByRole('link', { name: 'Página 2' }).click()
      await expect(page).toHaveURL(/pagina=2/)
      await expect.poll(() => api.last('GET', '/nfts')?.query.page).toBe('2')
      await expect(cards(page)).toHaveCount(4)
      const step4Titles = await cardTitles(page)

      // Refresh restaura filtro, aba, ordem, página e os cards.
      await page.reload()
      await ready(page)
      await expect(aside.getByRole('button', { name: /^Música, \d+ NFTs$/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toContainText('Menor preço')
      await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      await expect(cards(page)).toHaveCount(4)
      await expect.poll(() => cardTitles(page)).toEqual(step4Titles)

      // Voltar passo a passo no histórico.
      await page.goBack()
      await expect(page).not.toHaveURL(/pagina=2/)
      await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      await expect(cards(page)).toHaveCount(9)
      await expect.poll(() => cardTitles(page)).toEqual(step3Titles)

      await page.goBack()
      await expect(page).not.toHaveURL(/ordem=menor-preco/)
      await expect(page.getByRole('combobox', { name: 'Ordenar por' })).toContainText(
        'Listados recentemente',
      )

      await page.goBack()
      await expect(page).not.toHaveURL(/aba=em-alta/)
      await expect(page.getByRole('tab', { name: 'Todos os NFTs' })).toHaveAttribute(
        'aria-selected',
        'true',
      )

      await page.goBack()
      await expect(page).not.toHaveURL(/colecao=musica/)
      await expect(aside.getByRole('button', { name: /^Música, \d+ NFTs$/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      await expect.poll(() => cardTitles(page)).toEqual(step0Titles)

      // Avançar passo a passo no histórico restaura tudo até a página 2.
      await page.goForward()
      await expect(page).toHaveURL(/colecao=musica/)
      await expect(aside.getByRole('button', { name: /^Música, \d+ NFTs$/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )

      await page.goForward()
      await expect(page).toHaveURL(/aba=em-alta/)
      await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute(
        'aria-selected',
        'true',
      )

      await page.goForward()
      await expect(page).toHaveURL(/ordem=menor-preco/)
      await expect.poll(() => cardTitles(page)).toEqual(step3Titles)

      await page.goForward()
      await expect(page).toHaveURL(/pagina=2/)
      await expect(cards(page)).toHaveCount(4)
      await expect.poll(() => cardTitles(page)).toEqual(step4Titles)
    } else {
      // Mobile: filtro, aba e ordem criam entradas no histórico; Carregar mais e digitação usam replace.
      await page.getByRole('button', { name: /^Filtros/ }).click()
      const sheet = page.getByRole('dialog', { name: 'Filtros' })
      await sheet.getByRole('button', { name: /^Música, \d+ NFTs$/ }).click()
      await sheet.getByRole('button', { name: /^Ver / }).click()
      await expect(page).toHaveURL(/colecao=musica/)

      await page.getByRole('tab', { name: 'Em alta' }).click()
      await expect(page).toHaveURL(/aba=em-alta/)

      await page.getByRole('button', { name: /^Filtros/ }).click()
      await sheet.getByLabel('Ordenar por').click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
      await sheet.getByRole('button', { name: /^Ver / }).click()
      await expect(page).toHaveURL(/ordem=menor-preco/)

      // "Carregar mais" usa replace: atualiza para pagina=2 (13 cards: 9 + 4) sem empilhar nova entrada.
      await page.getByRole('button', { name: 'Carregar mais' }).click()
      await expect(page).toHaveURL(/pagina=2/)
      await expect(cards(page)).toHaveCount(13)
      const mobileLoadedTitles = await cardTitles(page)

      // Refresh restaura os 13 cards e os filtros ativos.
      await page.reload()
      await ready(page)
      await expect(cards(page)).toHaveCount(13)
      await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      await expect(page.getByRole('button', { name: 'Filtros, 1 ativos' })).toBeVisible()
      await expect.poll(() => cardTitles(page)).toEqual(mobileLoadedTitles)

      // Como "Carregar mais" usou replace no passo da ordenação, um único goBack volta antes da ordenação.
      await page.goBack()
      await expect(page).not.toHaveURL(/ordem=menor-preco/)
      await expect(page).not.toHaveURL(/pagina=2/)
      await expect(page).toHaveURL(/aba=em-alta/)

      await page.goBack()
      await expect(page).not.toHaveURL(/aba=em-alta/)
      await expect(page).toHaveURL(/colecao=musica/)

      await page.goBack()
      await expect(page).not.toHaveURL(/colecao=musica/)
      await expect.poll(() => cardTitles(page)).toEqual(step0Titles)

      // Avançar restaura a coleção; em seguida, digitar na busca mobile usa replace.
      await page.goForward()
      await expect(page).toHaveURL(/colecao=musica/)

      const searchBar = page.getByRole('searchbox', { name: 'Buscar NFTs e coleções' })
      await searchBar.fill('ape')
      await expect(page).toHaveURL(/q=ape/)
      await searchBar.fill('nomad')
      await expect(page).toHaveURL(/q=nomad/)

      // Como as buscas usaram replace sobre colecao=musica, um único goBack volta à Início limpa.
      await page.goBack()
      await expect(page).not.toHaveURL(/q=|colecao=/)
      await expect.poll(() => cardTitles(page)).toEqual(step0Titles)
    }
  })

  test('2. parâmetros inválidos na URL são normalizados sem erro e validateSearch devolve sempre as 9 chaves', async ({
    page,
  }, testInfo) => {
    const isDesktop = testInfo.project.name !== 'mobile'
    const api = recordApi(page)

    // 1) O validateSearch da rota é conferido pelo estado do router (abaixo).
    // 2) Navegação real com pagina=0, ordem=xyz e precoMin>precoMax: normaliza para os padrões.
    await page.goto('/?pagina=0&ordem=xyz&precoMin=10&precoMax=2')
    await ready(page)
    await expect(cards(page)).toHaveCount(9)
    await expect(page.locator('main [role="alert"]')).toHaveCount(0)

    const routerKeys1 = await page.evaluate<string[]>(
      `Object.keys(window.__kurio.router.routesByPath['/'].options.validateSearch({ pagina: '0', ordem: 'xyz', precoMin: '10', precoMax: '2' }))`,
    )
    expect(routerKeys1).toEqual([...SEARCH_KEYS])
    expect(api.last('GET', '/nfts')?.query).toEqual({
      page: '1',
      pageSize: '9',
    })

    // 3) pagina=abc também normaliza para a página 1.
    await page.goto('/?pagina=abc')
    await ready(page)
    await expect(cards(page)).toHaveCount(9)
    const routerKeys2 = await page.evaluate<string[]>(
      `Object.keys(window.__kurio.router.routesByPath['/'].options.validateSearch({ pagina: 'abc' }))`,
    )
    expect(routerKeys2).toEqual([...SEARCH_KEYS])
    expect(api.last('GET', '/nfts')?.query).toEqual({
      page: '1',
      pageSize: '9',
    })

    // 4) colecao=inexistente mostra EmptyState sem erro e permite limpar filtros.
    await page.goto('/?colecao=inexistente')
    await ready(page)
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await expect(page.locator('main [role="alert"]')).toHaveCount(0)
    const routerKeys3 = await page.evaluate<string[]>(
      `Object.keys(window.__kurio.router.routesByPath['/'].options.validateSearch({ colecao: 'inexistente' }))`,
    )
    expect(routerKeys3).toEqual([...SEARCH_KEYS])

    await page.locator('#catalogo').getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(cards(page)).toHaveCount(9)

    // 5) Página além do total (Fotografia tem 14 itens = 2 páginas no desktop).
    await page.goto('/?colecao=fotografia&pagina=99')
    await ready(page)
    await expect(page.locator('main [role="alert"]')).toHaveCount(0)

    if (isDesktop) {
      // No desktop redireciona com replace para a última página (pagina=2, 5 cards).
      await expect(page).toHaveURL(/colecao=fotografia/)
      await expect(page).toHaveURL(/pagina=2/)
      await expect(cards(page)).toHaveCount(5)
      await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    } else {
      // No mobile limita pageSize a 300 e exibe todos os 14 itens da coleção sem erro.
      await expect(cards(page)).toHaveCount(14)
      await expect(page.getByRole('button', { name: 'Carregar mais' })).toHaveCount(0)
    }
  })
})
