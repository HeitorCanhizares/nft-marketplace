import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

// Carteiras: só o caminho principal. Casos de borda ficam para a fase 13 (10-012).

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111'

type Credentials = { email: string; password: string }

async function signIn(page: Page, user: Credentials = users.primary) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(user)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openWallets(page: Page, user?: Credentials, query = '') {
  await signIn(page, user)
  await page.goto('/perfil/carteiras' + query)
  await ready(page)
  await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
}

const primary = (page: Page) => page.getByRole('region', { name: 'Carteira principal' })
const secondary = (page: Page) => page.getByRole('region', { name: 'Carteira secundária' })
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })

/** Preenche e salva a secundária a partir de "Igual à carteira principal". */
async function addSecondary(page: Page, nickname: string) {
  const section = secondary(page)
  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await section.getByLabel('Apelido da carteira').fill(nickname)
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
}

test('navegação desktop: "Carteiras" ativo no menu lateral', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  await openWallets(page)
  await expect(
    page
      .getByRole('complementary', { name: 'Menu do perfil' })
      .getByRole('link', { name: 'Carteiras' }),
  ).toHaveAttribute('aria-current', 'page')
})

test('navegação mobile: abre pelo menu do perfil e volta', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  await signIn(page)
  await page.goto('/perfil')
  await page.locator('#conteudo').getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)
  await expect(page.getByRole('heading', { name: 'Carteiras' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar' }).click()
  await expect(page).toHaveURL(/\/perfil$/)
})

test('principal: vem preenchida, edita o apelido e persiste', async ({ page }) => {
  await openWallets(page)
  const section = primary(page)
  await expect(section.getByRole('button', { name: 'Editar' })).toBeVisible()
  await expect(section.getByLabel('Apelido da carteira')).toHaveValue('Carteira de teste')
  await expect(section.getByLabel('Endereço da carteira')).toHaveValue(
    '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
  )
  const save = section.getByRole('button', { name: 'Salvar carteira' })
  await expect(save).toBeDisabled()

  await section.getByLabel('Apelido da carteira').fill('Minha principal')
  await save.click()
  await expect(page.getByText('Carteira principal salva').first()).toBeVisible()

  await page.reload()
  await ready(page)
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Minha principal')
})

test('primeira carteira: pré-preenchida pelo perfil, valida e salva', async ({ page }) => {
  await openWallets(page, users.other)
  const section = primary(page)
  await expect(section.getByRole('button', { name: 'Adicionar' })).toBeVisible()
  await expect(section.getByLabel('Nome de exibição')).toHaveValue('Outro Kurio')
  await expect(section.getByLabel('E-mail')).toHaveValue('outro@kurio.test')

  await section.getByLabel('Apelido da carteira').fill('Primeira')
  await section.getByLabel('Endereço da carteira').fill('0x123')
  await section.getByLabel('Nome do perfil').click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()

  await section.getByLabel('Endereço da carteira').fill(OTHER_ADDRESS)
  await section.getByLabel('Nome do perfil').fill('Outro Kurio')
  await section.getByLabel('Código de indicação').fill('OUTRO123')
  await section.getByLabel('Nome ENS').fill('outro-kurio')
  await section.getByLabel('Rede').click()
  await page.getByRole('option', { name: 'Polygon' }).click()
  await section.getByLabel('Tipo de carteira').click()
  await page.getByRole('option', { name: 'MetaMask' }).click()
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira principal salva').first()).toBeVisible()
  await expect(section.getByRole('button', { name: 'Editar' })).toBeVisible()
})

test('obrigatórios vazios: mostra o erro e foca o primeiro campo', async ({ page }) => {
  await openWallets(page, users.other)
  const section = primary(page)
  await section.getByLabel('Apelido da carteira').fill('x')
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(section.getByText(/obrigatório/i).first()).toBeVisible()
  await expect(section.locator('[aria-invalid="true"]').first()).toBeFocused()
})

test('secundária: igual à principal, salva, remove e volta ao vazio', async ({ page }) => {
  await openWallets(page)
  const section = secondary(page)
  await expect(section.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await expect(section.getByLabel('Endereço da carteira')).toHaveValue(
    '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
  )
  await section.getByLabel('Apelido da carteira').fill('Secundária')
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()

  await page.reload()
  await ready(page)
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Carteira de teste')
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('Secundária')

  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const dialog = dialogOf(page, 'Remover carteira secundária?')
  await dialog.getByRole('button', { name: 'Remover' }).click()
  await expect(dialog).toBeHidden()
  await expect(
    secondary(page).getByText('Você ainda não adicionou uma carteira secundária.'),
  ).toBeVisible()
  await expect(secondary(page).getByRole('button', { name: 'Adicionar' })).toBeFocused()
})

test('tornar principal: troca os valores das duas carteiras', async ({ page }) => {
  await openWallets(page)
  await addSecondary(page, 'Secundária')

  const swap = secondary(page).getByRole('button', { name: 'Tornar principal' })
  await secondary(page).getByLabel('Apelido da carteira').fill('Editando')
  await expect(swap).toBeDisabled()
  await secondary(page).getByLabel('Apelido da carteira').fill('Secundária')
  await expect(swap).toBeEnabled()

  await swap.click()
  const dialog = dialogOf(page, 'Tornar principal?')
  await dialog.getByRole('button', { name: 'Tornar principal' }).click()
  await expect(page.getByText('Carteiras trocadas').first()).toBeVisible()
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Secundária')
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('Carteira de teste')
})

test('alterações não salvas: pede confirmação ao sair', async ({ page }, testInfo) => {
  await openWallets(page)
  await primary(page).getByLabel('Apelido da carteira').fill('Mudou')
  const leave = isDesktop(testInfo)
    ? page
        .getByRole('complementary', { name: 'Menu do perfil' })
        .getByRole('link', { name: 'Dados do perfil' })
    : page.getByRole('link', { name: 'Voltar' })
  await leave.click()
  const dialog = dialogOf(page, 'Descartar alterações?')
  await dialog.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)
  await leave.click()
  await dialogOf(page, 'Descartar alterações?').getByRole('button', { name: 'Descartar' }).click()
  await expect(page).not.toHaveURL(/\/perfil\/carteiras$/)
})

test('voltar ao pagamento: aparece com redirect e retorna ao salvar', async ({
  page,
}, testInfo) => {
  await openWallets(page, users.primary, '?redirect=/pagamento')
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('link', { name: /Voltar ao pagamento/ })).toBeVisible()
  }
  await primary(page).getByLabel('Apelido da carteira').fill('Para o pagamento')
  await primary(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page).toHaveURL(/\/pagamento/)
})
