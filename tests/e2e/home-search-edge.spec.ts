// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { delayApi, only, openApp, ready, recordApi } from './helpers.ts'

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

const cards = (page: Page) =>
  page
    .locator('#catalogo')
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })

async function submitSearch(page: Page, testInfo: TestInfo, term: string) {
  if (isDesktop(testInfo)) {
    const banner = page.getByRole('banner')
    const input = banner.getByRole('textbox', { name: 'Buscar NFTs e coleções' })
    if (!(await input.isVisible())) {
      await banner.getByRole('button', { name: 'Abrir busca' }).click()
    }
    await input.fill(term)
    await input.press('Enter')
    return
  }

  const bar = page.getByRole('searchbox', { name: 'Buscar NFTs e coleções' })
  await bar.fill(term)
  await bar.press('Enter')
  await bar.evaluate((input: HTMLInputElement) => input.form?.requestSubmit())
}

test.describe('Início — Busca: vazio, debounce, normalização e cancelamento', () => {
  test('1. sem resultados (q=zzzz) exibe EmptyState com "Limpar filtros" e limpar volta ao catálogo', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await submitSearch(page, testInfo, 'zzzz')

    await expect(page).toHaveURL(/q=zzzz/)
    await expect(
      page.locator('#catalogo').getByRole('heading', { level: 3, name: 'Nenhum NFT encontrado' }),
    ).toBeVisible()
    await expect(
      page.locator('#catalogo').getByText('Tente mudar os filtros ou a busca.'),
    ).toBeVisible()

    const clearBtn = page.locator('#catalogo').getByRole('button', { name: 'Limpar filtros' })
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    await expect(page).not.toHaveURL(/q=/)
    await expect(cards(page)).toHaveCount(9)
  })

  test('2. [m] debounce de 300 ms envia uma única chamada com o último valor e "Limpar busca" zera q e a URL', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    api.clear()
    const bar = page.getByRole('searchbox', { name: 'Buscar NFTs e coleções' })
    await bar.pressSequentially('cosmic', { delay: 25 })

    await expect(page).toHaveURL(/q=cosmic/)
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Cosmic Bloom #118')

    // Digitação rápida dentro da janela de debounce gera uma única chamada para q=cosmic
    const searchCalls = api.calls('GET', '/nfts').filter((c) => c.query.q !== undefined)
    expect(searchCalls).toHaveLength(1)
    expect(searchCalls[0]?.query.q).toBe('cosmic')

    // Botão "Limpar busca" zera o campo e remove q da URL imediatamente
    api.clear()
    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await expect(bar).toHaveValue('')
    await expect(page).not.toHaveURL(/q=/)
    await expect(cards(page)).toHaveCount(9)
    expect(api.last('GET', '/nfts')?.query.q).toBeUndefined()
  })

  test('2. [d] Enter envia na hora, Esc fecha a busca e limpar filtros zera q e a URL', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    const api = recordApi(page)
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    const banner = page.getByRole('banner')
    const openBtn = banner.getByRole('button', { name: 'Abrir busca' })
    const input = banner.getByRole('textbox', { name: 'Buscar NFTs e coleções' })

    api.clear()
    await openBtn.click()
    await expect(input).toBeFocused()
    await input.fill('cosmic')

    // Antes do Enter nenhuma chamada com q é disparada
    expect(api.calls('GET', '/nfts')).toHaveLength(0)

    // Esc fecha o campo e devolve o foco ao gatilho sem buscar
    await input.press('Escape')
    await expect(input).toBeHidden()
    await expect(openBtn).toBeFocused()
    await expect(page).not.toHaveURL(/q=/)

    // Enter envia na hora
    await openBtn.click()
    await input.fill('cosmic')
    await input.press('Enter')
    await expect(page).toHaveURL(/q=cosmic/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.q).toBe('cosmic')
    await expect(cards(page)).toHaveCount(1)

    // Limpar filtros zera q e a URL
    await page
      .getByRole('complementary', { name: 'Filtros' })
      .getByRole('button', { name: 'Limpar filtros' })
      .click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(cards(page)).toHaveCount(9)
  })

  test('3. espaços, caracteres especiais e acentos são normalizados e codificados; combina com filtros/ordem e restaura no histórico', async ({
    page,
  }, testInfo) => {
    const api = recordApi(page)
    await openApp(page)

    // Espaços nas pontas sofrem trim
    api.clear()
    await submitSearch(page, testInfo, '  cosmic  ')
    await expect(page).toHaveURL(/q=cosmic/)
    await expect.poll(() => api.last('GET', '/nfts')?.query.q).toBe('cosmic')
    await expect(cards(page)).toHaveCount(1)

    // Caracteres especiais ("ape & co", "%") e acentos ("óculos"): codificados na URL e decodificados na API
    for (const raw of ['ape & co', '100%', 'óculos']) {
      api.clear()
      await submitSearch(page, testInfo, raw)
      await expect.poll(() => api.last('GET', '/nfts')?.query.q).toBe(raw)
      await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(raw)
    }

    // Busca por "óculos" (com acento) encontra NFTs com o atributo "Óculos"
    await expect(cards(page).first()).toBeVisible()

    // Combina busca com filtro de rede e ordenação
    await submitSearch(page, testInfo, 'ape')
    await expect(page).toHaveURL(/q=ape/)

    if (isDesktop(testInfo)) {
      await page.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
      await page.getByRole('combobox', { name: 'Ordenar por' }).click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
    } else {
      await page.getByRole('button', { name: /^Filtros/ }).click()
      const sheet = page.getByRole('dialog', { name: 'Filtros' })
      await sheet.getByRole('button', { name: /^Ethereum, \d+ NFTs$/ }).click()
      await sheet.getByRole('combobox', { name: 'Ordenar por' }).click()
      await page.getByRole('option', { name: 'Menor preço' }).click()
      await sheet.getByRole('button', { name: /^(Ver |Nenhum resultado)/ }).click()
      await expect(sheet).toHaveCount(0)
    }

    await expect(page).toHaveURL(/q=ape/)
    await expect(page).toHaveURL(/rede=ethereum/)
    await expect(page).toHaveURL(/ordem=menor-preco/)
    await expect
      .poll(() => api.last('GET', '/nfts')?.query)
      .toMatchObject({
        q: 'ape',
        network: 'ethereum',
        sort: 'price_asc',
      })

    // Navegação no histórico restaura a busca anterior, o campo e os resultados
    await page.goto('/?q=cosmic')
    await ready(page)
    await expect(cards(page)).toHaveCount(1)
    await page.goto('/?q=emerald')
    await ready(page)
    await expect(cards(page).first()).toContainText('Emerald Ape #042')

    await page.goBack()
    await expect(page).toHaveURL(/q=cosmic/)
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Cosmic Bloom #118')

    if (isDesktop(testInfo)) {
      await page.getByRole('banner').getByRole('button', { name: 'Abrir busca' }).click()
      await expect(
        page.getByRole('banner').getByRole('textbox', { name: 'Buscar NFTs e coleções' }),
      ).toHaveValue('cosmic')
    } else {
      await expect(page.getByRole('searchbox', { name: 'Buscar NFTs e coleções' })).toHaveValue(
        'cosmic',
      )
    }
  })

  test('4. resposta antiga atrasada não sobrescreve a busca mais recente', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await expect(cards(page)).toHaveCount(9)

    // Atrasa apenas a 1ª busca (q=emerald) em 600 ms; a 2ª (q=cosmic) responde rápido
    await delayApi(page, /\/api\/nfts\?.*q=emerald/, 600, { once: true })
    const firstSent = page.waitForRequest(
      (req) => req.url().includes('/api/nfts') && req.url().includes('q=emerald'),
    )
    const firstSettled = page
      .waitForResponse(
        (res) => res.url().includes('/api/nfts') && res.url().includes('q=emerald'),
        { timeout: 2_000 },
      )
      .catch(() => null)

    await submitSearch(page, testInfo, 'emerald')
    await firstSent
    await submitSearch(page, testInfo, 'cosmic')

    await expect(page).toHaveURL(/q=cosmic/)
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Cosmic Bloom #118')

    await firstSettled
    await expect(page).toHaveURL(/q=cosmic/)
    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Cosmic Bloom #118')
  })
})
