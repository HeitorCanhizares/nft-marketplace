import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Perfil: só o caminho principal. Casos de borda ficam para a fase 13 (09-016).

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

// PNG de 1 x 1 pixel, em memória.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function signIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openData(page: Page) {
  await signIn(page)
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const save = (page: Page) => page.getByRole('button', { name: 'Salvar' })
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })
const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Menu do perfil' })

test('navegação desktop: redireciona para os dados e marca o item ativo', async ({
  page,
}, testInfo) => {
  only(testInfo, 'desktop')
  await signIn(page)
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/perfil\/dados$/)
  await expect(sidebar(page).getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(sidebar(page).getByRole('button', { name: /^Atividade/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

test('navegação mobile: lista, dados e voltar', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  await signIn(page)
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
  await expect(page.locator('#conteudo').getByText('Teste Kurio')).toBeVisible()
  await page.getByRole('link', { name: 'Dados do perfil' }).click()
  await expect(page).toHaveURL(/\/perfil\/dados$/)
  await expect(page.getByRole('heading', { name: 'Dados do perfil' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar' }).click()
  await expect(page).toHaveURL(/\/perfil$/)
})

test('dados: edita, salva, atualiza o menu e persiste', async ({ page }, testInfo) => {
  await openData(page)
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('teste')
  await expect(page.getByLabel('E-mail')).toHaveValue('teste@kurio.test')

  await page.getByLabel('Nome de exibição').fill('Colecionador Novo')
  await page.getByLabel('Nome ENS').fill('colecionador')
  await page.getByLabel('Apelido da carteira').fill('Carteira 1')
  await save(page).click()
  await expect(page.getByText('Perfil atualizado').first()).toBeVisible()
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('button', { name: 'Menu de Colecionador Novo' })).toBeVisible()
  }

  await page.reload()
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador Novo')
  await expect(page.getByLabel('Nome ENS')).toHaveValue('colecionador')
  await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Carteira 1')
})

test('disponibilidade do nome de usuário', async ({ page }) => {
  await openData(page)
  const username = page.getByLabel('Nome de usuário')
  await username.fill('outro')
  await page.getByLabel('Nome de exibição').click()
  await expect(page.getByText('Este nome de usuário já está em uso')).toBeVisible()
  await username.fill('teste')
  await page.getByLabel('Nome de exibição').click()
  await expect(page.getByText('Este nome de usuário já está em uso')).toHaveCount(0)
})

test('e-mail: trocar pede a senha atual', async ({ page }) => {
  await openData(page)
  await page.getByLabel('E-mail').fill('novo@kurio.test')
  await save(page).click()
  const dialog = dialogOf(page, 'Confirme sua senha')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Senha atual').fill(users.primary.password)
  await dialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Perfil atualizado').first()).toBeVisible()

  await page.reload()
  await ready(page)
  await expect(page.getByLabel('E-mail')).toHaveValue('novo@kurio.test')
})

test('senha: troca e limpa os campos', async ({ page }) => {
  await openData(page)
  await page.getByLabel('Senha atual', { exact: true }).fill(users.primary.password)
  await page.getByLabel('Nova senha', { exact: true }).fill('Novasenha123')
  await page.getByLabel('Confirmar nova senha').fill('Novasenha123')
  await save(page).click()
  await expect(page.getByText('Senha alterada').first()).toBeVisible()
  await expect(page.getByLabel('Senha atual', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Confirmar nova senha')).toHaveValue('')
})

test('avatar: prévia, usar, persistir e remover', async ({ page }, testInfo) => {
  await openData(page)
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByRole('button', { name: 'Usar esta foto' })).toBeVisible()
  await page.getByRole('button', { name: 'Usar esta foto' }).click()
  const photo = page.getByRole('img', { name: 'Sua foto de perfil' })
  await expect(page.getByRole('button', { name: 'Alterar', exact: true })).toBeVisible()
  await expect(photo).toBeVisible()
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('button', { name: /^Menu de/ }).locator('img')).toBeVisible()
  }

  await page.reload()
  await ready(page)
  await expect(photo).toBeVisible()

  await page.getByRole('button', { name: 'Remover' }).click()
  const dialog = dialogOf(page, 'Remover foto?')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Remover' }).click()
  await expect(dialog).toBeHidden()
  await expect(photo).toHaveCount(0)
})

test('alterações não salvas: aviso ao sair (desktop)', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  await openData(page)
  await page.getByLabel('Nome de exibição').fill('Outro nome')
  await sidebar(page).getByRole('link', { name: 'Carteiras' }).click()
  const dialog = dialogOf(page, 'Descartar alterações?')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(page).toHaveURL(/\/perfil\/dados$/)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Outro nome')
  await sidebar(page).getByRole('link', { name: 'Carteiras' }).click()
  await dialogOf(page, 'Descartar alterações?').getByRole('button', { name: 'Descartar' }).click()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)
})

test('alterações não salvas: aviso ao sair (mobile)', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  await openData(page)
  await page.getByLabel('Nome de exibição').fill('Outro nome')
  await page.getByRole('link', { name: 'Voltar' }).click()
  const dialog = dialogOf(page, 'Descartar alterações?')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(page).toHaveURL(/\/perfil\/dados$/)
  await page.getByRole('link', { name: 'Voltar' }).click()
  await dialogOf(page, 'Descartar alterações?').getByRole('button', { name: 'Descartar' }).click()
  await expect(page).toHaveURL(/\/perfil$/)
})

test('sair leva ao início como visitante', async ({ page }, testInfo) => {
  await signIn(page)
  await page.goto('/perfil')
  await ready(page)
  const scope = isDesktop(testInfo) ? sidebar(page) : page
  await scope.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
  if (isDesktop(testInfo)) {
    await expect(
      page
        .getByRole('link', { name: 'Entrar' })
        .or(page.getByRole('button', { name: 'Entrar' }))
        .first(),
    ).toBeVisible()
  }
})
