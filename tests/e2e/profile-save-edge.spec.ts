/// <reference lib="dom" />
import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import {
  announcements,
  authState,
  collectAnnouncements,
  only,
  openApp,
  ready,
  recordApi,
  scenarios,
  signInAs,
} from './helpers.ts'

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

async function openProfileData(page: Page) {
  await openApp(page)
  await signInAs(page, 'primary')
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Salvar' })
const discardDialog = (page: Page) => page.getByRole('dialog', { name: 'Descartar alterações?' })
const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Menu do perfil' })
const genericSaveError = (page: Page) =>
  page
    .locator('#conteudo')
    .getByText('Não foi possível salvar. Verifique sua conexão e tente novamente.')

test.describe('Perfil — salvar, alterações não salvas, sessão e estados (13-054)', () => {
  test('1. Erros de cliente bloqueiam Salvar por inteiro; erros de API são independentes por bloco', async ({
    page,
  }) => {
    await openProfileData(page)

    // 1) Erro de formato no cliente bloqueia Salvar por inteiro (nenhuma chamada enviada à API)
    await page.getByLabel('Nome de exibição').fill('Nome Valido')
    await page.getByLabel('Senha atual', { exact: true }).fill(users.primary.password)
    await page.getByLabel('Nova senha', { exact: true }).fill('123') // Senha curta demais (< 8)

    const api = recordApi(page)
    await saveButton(page).click()
    await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()
    expect(api.calls('PATCH', '/profile')).toHaveLength(0)
    expect(api.calls('POST', '/profile/password')).toHaveLength(0)

    // Limpa campos de senha
    await page.getByLabel('Senha atual', { exact: true }).fill('')
    await page.getByLabel('Nova senha', { exact: true }).fill('')

    // 2) Erros de API são independentes: bloco de dados com 500 não desfaz sucesso de senha
    await page.getByLabel('Nome de exibição').fill('Colecionador Teste')
    await page.getByLabel('Senha atual', { exact: true }).fill(users.primary.password)
    await page.getByLabel('Nova senha', { exact: true }).fill('Novasenha123')
    await page.getByLabel('Confirmar nova senha').fill('Novasenha123')

    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:PATCH /profile')`,
    )
    await saveButton(page).click()

    // Bloco de dados acusa falha e mantém valor no campo
    await expect(genericSaveError(page)).toBeVisible()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador Teste')

    // Bloco de senha teve sucesso: limpou os campos e exibiu toast
    await expect(page.getByText('Senha alterada').first()).toBeVisible()
    await expect(page.getByLabel('Senha atual', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('')

    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
  })

  test('2. 5xx/rede preserva formulário; Salvar desabilitado sem alterações; duplo clique envia 1 requisição por bloco; persistência e anúncios', async ({
    page,
  }) => {
    await openProfileData(page)

    // "Salvar" desabilitado sem alterações
    await expect(saveButton(page)).toBeDisabled()

    // Falha de rede/500 em PATCH /profile
    await page.getByLabel('Nome de exibição').fill('Novo Nome Salvar')
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:PATCH /profile')`,
    )
    await saveButton(page).click()

    await expect(genericSaveError(page)).toBeVisible()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Novo Nome Salvar')

    // Limpa o erro e testa duplo clique: apenas 1 requisição por bloco
    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    const api = recordApi(page)
    await collectAnnouncements(page)
    await saveButton(page).click({ clickCount: 3 })

    await expect(page.getByText('Perfil atualizado').first()).toBeVisible()
    expect(api.calls('PATCH', '/profile')).toHaveLength(1)
    expect(await announcements(page)).toContain('Perfil atualizado')

    // Persistência após refresh
    await page.reload()
    await ready(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Novo Nome Salvar')
  })

  test('3. beforeunload; diálogo Descartar alterações ao navegar, voltar e sair; session-expired não trava no diálogo', async ({
    page,
  }, testInfo) => {
    await openProfileData(page)

    // 1) beforeunload com alterações
    await page.getByLabel('Nome de exibição').fill('Alteração Pendente')
    const beforeUnloadPrevented = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented || event.returnValue === false
    })
    expect(beforeUnloadPrevented).toBe(true)

    // 2) Diálogo "Descartar alterações?" ao navegar por link
    const targetLink = isDesktop(testInfo)
      ? sidebar(page).getByRole('link', { name: 'Carteiras' })
      : page.getByRole('link', { name: 'Voltar' })

    await targetLink.click()
    const dialog = discardDialog(page)
    await expect(dialog).toBeVisible()

    // Cancelar mantém na página com o formulário alterado
    await dialog.getByRole('button', { name: 'Continuar editando' }).click()
    await expect(page).toHaveURL(/\/perfil\/dados$/)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Alteração Pendente')

    // Descartar sai da página
    await targetLink.click()
    await discardDialog(page).getByRole('button', { name: 'Descartar' }).click()
    if (isDesktop(testInfo)) {
      await expect(page).toHaveURL(/\/perfil\/carteiras$/)
    } else {
      await expect(page).toHaveURL(/\/perfil$/)
    }

    // 3) "Descartar alterações?" ao clicar em "Sair" com formulário alterado
    await page.goto('/perfil/dados')
    await ready(page)
    await page.getByLabel('Nome de exibição').fill('Nome Antes De Sair')

    const signOutButton = isDesktop(testInfo)
      ? sidebar(page).getByRole('button', { name: 'Sair', exact: true })
      : page.getByRole('button', { name: 'Sair', exact: true })

    if (isDesktop(testInfo)) {
      await signOutButton.click()
      await expect(discardDialog(page)).toBeVisible()
      await discardDialog(page).getByRole('button', { name: 'Continuar editando' }).click()
      await expect(page).toHaveURL(/\/perfil\/dados$/)

      await signOutButton.click()
      await discardDialog(page).getByRole('button', { name: 'Descartar' }).click()
      await expect(page).toHaveURL(/\/$/)
      await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    }

    // 4) session-expired durante a edição não fica preso no UnsavedChangesGuard
    await signInAs(page, 'primary')
    await page.goto('/perfil/dados')
    await ready(page)
    await page.getByLabel('Nome de exibição').fill('Editando Sessao')
    await page.evaluate(`window.__kurio.emitSessionExpired()`)

    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fdados$/)
    await expect(discardDialog(page)).toHaveCount(0)

    // 5) session-expired direto em GET /profile
    await scenarios(page, 'session-expired')
    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fdados$/)
  })

  test('4. server-error em GET /profile mostra ErrorState com Tentar novamente; skeleton em slow; [d] resize; acesso deslogado e foco h1', async ({
    page,
  }, testInfo) => {
    // 1) server-error em GET /profile mostra ErrorState com "Tentar novamente"
    await scenarios(page, 'server-error:GET /profile')
    await openApp(page)
    await signInAs(page, 'primary')
    await page.goto('/perfil/dados')
    await ready(page)

    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    const retryButton = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryButton).toBeVisible()

    // Limpa o erro e clica em "Tentar novamente": o formulário carrega
    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    await page.addInitScript(`localStorage.removeItem('kurio:mock:scenarios')`)
    await retryButton.click()
    await expect(page.getByLabel('Nome de exibição')).toBeVisible()

    // 2) Acesso direto deslogado a /perfil/dados vai ao login e volta após entrar
    await page.evaluate(`window.__kurio.auth.signOut()`)
    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fdados$/)
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
    await expect(page).toHaveURL(/\/perfil\/dados$/)
    await expect(page.getByLabel('Nome de exibição')).toBeVisible()

    // 3) [d] Redimensionar de mobile para desktop em /perfil redireciona a /perfil/dados
    if (isDesktop(testInfo)) {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/perfil')
      await ready(page)
      await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()

      await page.setViewportSize({ width: 1280, height: 800 })
      await expect(page).toHaveURL(/\/perfil\/dados$/)
    }

    // 4) Título do documento e foco no h1 ao navegar entre /perfil e /perfil/dados (mobile)
    if (!isDesktop(testInfo)) {
      only(testInfo, 'mobile')
      await page.goto('/perfil')
      await ready(page)
      await expect(page).toHaveTitle(new RegExp('Meu perfil'))

      await page.getByRole('link', { name: 'Dados do perfil' }).click()
      await expect(page).toHaveURL(/\/perfil\/dados$/)
      await expect(page).toHaveTitle(new RegExp('Dados do perfil'))
      await expect(page.getByRole('heading', { level: 1, name: 'Dados do perfil' })).toBeFocused()

      await page.getByRole('link', { name: 'Voltar' }).click()
      await expect(page).toHaveURL(/\/perfil$/)
      await expect(page).toHaveTitle(new RegExp('Meu perfil'))
      await expect(page.getByRole('heading', { level: 1, name: 'Meu perfil' })).toBeFocused()
    }
  })
})
