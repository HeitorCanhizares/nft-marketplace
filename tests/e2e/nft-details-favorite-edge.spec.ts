// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, ready, signInAs } from './helpers.ts'

const PATH = '/nft/emerald-ape-042'
const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

async function go(page: Page, path = PATH) {
  await page.goto(path)
  await ready(page)
}

function favoriteButton(page: Page) {
  return page.getByRole('button', { name: /Favoritar Emerald Ape/i }).first()
}

function newAccount() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return {
    username: `u${suffix}`.slice(0, 20),
    email: `u${suffix}@kurio.test`,
    password: `Aa1${Math.random().toString(36).slice(2, 12)}`,
  }
}

test.describe('Detalhes — favoritar (deslogado, erro, persistência e cache) (13-032)', () => {
  test('1. deslogado redireciona a /entrar; após login e após cadastro volta com NFT favoritado', async ({
    page,
  }, testInfo) => {
    // A) Deslogado -> clica em favoritar -> vai para /entrar com redirect
    await openApp(page)
    await go(page)

    const fav = favoriteButton(page)
    await fav.click()

    await expect(page).toHaveURL(/\/entrar\?redirect=/)

    // B) Faz login com usuário que não tinha o NFT favoritado (outro@kurio.test)
    const authScope = isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
    await authScope.getByLabel('E-mail').fill(users.other.email)
    await authScope.getByLabel('Senha', { exact: true }).fill(users.other.password)
    await authScope.getByRole('button', { name: 'Entrar', exact: true }).click()

    // Volta ao detalhe com o NFT favoritado
    await expect(page).toHaveURL(new RegExp(`${PATH}$`))
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

    // C) Desloga para testar o fluxo com cadastro
    await page.evaluate(`(async () => {
      await window.__kurio?.auth.signOut()
    })()`)
    await go(page)

    // Clica em favoritar deslogado novamente
    await favoriteButton(page).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)

    // Clica no link para criar conta / cadastro
    // Desktop: aba "Criar conta" no modal. Mobile: link "Crie uma conta" no fim da página.
    if (isDesktop(testInfo)) {
      await page.getByRole('dialog').getByRole('link', { name: 'Criar conta', exact: true }).click()
    } else {
      await page.getByRole('main').getByRole('link', { name: 'Crie uma conta' }).click()
    }
    await expect(page).toHaveURL(/\/cadastro\?redirect=/)

    // Preenche o formulário de cadastro
    const signupForm = isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
    const account = newAccount()
    await signupForm.getByLabel('Nome de usuário').fill(account.username)
    await signupForm.getByLabel('E-mail').fill(account.email)
    await signupForm.getByLabel('Senha', { exact: true }).fill(account.password)
    await signupForm.getByLabel('Confirmar senha').fill(account.password)

    const submitName = isDesktop(testInfo) ? 'Criar conta' : 'Criar perfil'
    await signupForm.getByRole('button', { name: submitName, exact: true }).click()

    // Volta ao detalhe com a ação pendente executada (favoritado)
    await expect(page).toHaveURL(new RegExp(`${PATH}$`))
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('2. erro ao favoritar desfaz e avisa; persistência após novo login/refresh; coração síncrono com a Início', async ({
    page,
  }) => {
    // Usuário primary tem o Emerald Ape favoritado no seed
    await openApp(page)
    await signInAs(page, 'primary')
    await go(page)

    const fav = favoriteButton(page)
    await expect(fav).toHaveAttribute('aria-pressed', 'true')

    // A) Erro na remoção: simula falha 500 no mock
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:DELETE /favorites/:nftId')`,
    )
    await fav.click()

    // Toast de erro exibido e estado volta a pressed="true"
    await expect(
      page.getByText('Não foi possível remover dos favoritos Emerald Ape #042. Tente de novo.'),
    ).toBeVisible()
    await expect(fav).toHaveAttribute('aria-pressed', 'true')

    // Limpa erro no mock
    await page.evaluate(() => localStorage.removeItem('kurio:mock:scenarios'))

    // B) Persiste ao recarregar
    await page.reload()
    await ready(page)
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

    // C) Persiste a novo login
    await page.evaluate(`(async () => {
      await window.__kurio?.auth.signOut()
    })()`)
    await signInAs(page, 'primary')
    await go(page)
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true')

    // D) Coerência com a Início: desfavorita no detalhe e verifica na Início
    const removed = page.waitForResponse(
      (res) => res.request().method() === 'DELETE' && res.url().includes('/api/favorites/'),
    )
    await fav.click()
    await expect(fav).toHaveAttribute('aria-pressed', 'false')
    await removed

    await page.goto('/')
    await ready(page)
    const cardFav = page
      .locator('#catalogo')
      .getByRole('listitem')
      .filter({ hasText: 'Emerald Ape #042' })
      .getByRole('button', { name: /Favoritar Emerald Ape/i })
    await expect(cardFav).toHaveAttribute('aria-pressed', 'false')
  })
})
