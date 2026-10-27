import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

type Credentials = { email: string; password: string }

async function signIn(page: Page, user: Credentials = users.primary) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(user)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openWallets(page: Page, user: Credentials = users.primary) {
  await signIn(page, user)
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
}

const primary = (page: Page) => page.getByRole('region', { name: 'Carteira principal' })
const secondary = (page: Page) => page.getByRole('region', { name: 'Carteira secundária' })
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })

async function addSecondary(page: Page, nickname: string) {
  const section = secondary(page)
  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await section.getByLabel('Apelido da carteira').fill(nickname)
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
}

test('1. "Igual à carteira principal": desabilitado sem principal, copia uma vez, sobrescreve e some quando salva', async ({
  page,
}) => {
  // 1a. Sem carteira principal (usuário other)
  await openWallets(page, users.other)
  const otherSecondary = secondary(page)
  const disabledRadio = otherSecondary.getByRole('radio', { name: 'Igual à carteira principal' })
  await expect(disabledRadio).toBeDisabled()
  await expect(otherSecondary.getByText('Cadastre a carteira principal primeiro.')).toBeVisible()

  // 1b. Com carteira principal cadastrada
  await openWallets(page, users.primary)
  const sSection = secondary(page)
  const pSection = primary(page)

  // Abre formulário e digita dados prévios
  await sSection.getByRole('button', { name: 'Adicionar' }).click()
  const secNickname = sSection.getByLabel('Apelido da carteira')
  await secNickname.fill('Rascunho Customizado')

  // Copia sobre o formulário já editado sem pedir confirmação
  await sSection.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await expect(secNickname).toHaveValue('Carteira de teste')
  await expect(sSection.getByLabel('Endereço da carteira')).toHaveValue(
    '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
  )

  // Copia uma única vez: editar a principal não afeta a secundária
  await pSection.getByLabel('Apelido da carteira').fill('Principal Alterada')
  await expect(secNickname).toHaveValue('Carteira de teste')

  // Salvar a secundária faz o rádio sumir
  await sSection.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
  await expect(sSection.getByRole('radio', { name: 'Igual à carteira principal' })).toHaveCount(0)
})

test('2. secundária sem principal avisa e foca no formulário ao adicionar e em "Adicionar" ao remover', async ({
  page,
}) => {
  // 2a. Sem principal: aviso e foco em displayName ao adicionar
  await openWallets(page, users.other)
  const sSection = secondary(page)
  await expect(sSection.getByText('Cadastre a carteira principal primeiro.')).toBeVisible()

  await sSection.getByRole('button', { name: 'Adicionar' }).click()
  await expect(sSection.getByLabel('Nome de exibição')).toBeFocused()

  // 2b. Com principal e secundária adicionada: foco retorna para "Adicionar" após remover
  await openWallets(page, users.primary)
  await addSecondary(page, 'Para Remover')

  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const dialog = dialogOf(page, 'Remover carteira secundária?')
  await dialog.getByRole('button', { name: 'Remover' }).click()
  await expect(dialog).toBeHidden()

  await expect(
    secondary(page).getByText('Você ainda não adicionou uma carteira secundária.'),
  ).toBeVisible()
  await expect(secondary(page).getByRole('button', { name: 'Adicionar' })).toBeFocused()
})

test('3. "Tornar principal" bloqueado com alterações pendentes e troca preserva os ids das carteiras', async ({
  page,
}) => {
  await openWallets(page)
  await addSecondary(page, 'Secundária Inicial')

  const swapBtn = secondary(page).getByRole('button', { name: 'Tornar principal' })
  await expect(swapBtn).toBeEnabled()

  // 3a. Alteração na principal bloqueia o swap
  await primary(page).getByLabel('Apelido da carteira').fill('Editando Principal')
  await expect(swapBtn).toBeDisabled()
  await expect(
    secondary(page).getByText('Salve ou descarte as alterações para trocar.'),
  ).toBeVisible()

  // Reverte principal
  await primary(page).getByLabel('Apelido da carteira').fill('Carteira de teste')
  await expect(swapBtn).toBeEnabled()

  // 3b. Alteração na secundária bloqueia o swap
  await secondary(page).getByLabel('Apelido da carteira').fill('Editando Secundária')
  await expect(swapBtn).toBeDisabled()
  await expect(
    secondary(page).getByText('Salve ou descarte as alterações para trocar.'),
  ).toBeVisible()

  // Reverte secundária
  await secondary(page).getByLabel('Apelido da carteira').fill('Secundária Inicial')
  await expect(swapBtn).toBeEnabled()

  // 3c. Captura os ids no banco mock antes da troca
  const before = await page.evaluate<Record<string, string | undefined>>(`(async () => {
    const records = await window.__kurioMock.stores.walletsStore.getByUserId('user-teste')
    const p = records.find((r) => r.slot === 'primary')
    const s = records.find((r) => r.slot === 'secondary')
    return { primaryId: p?.id, secondaryId: s?.id }
  })()`)

  // Executa o swap
  await swapBtn.click()
  const dialog = dialogOf(page, 'Tornar principal?')
  await dialog.getByRole('button', { name: 'Tornar principal' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Carteiras trocadas').first()).toBeVisible()

  // Confirmação visual da inversão dos apelidos
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Secundária Inicial')
  await expect(secondary(page).getByLabel('Apelido da carteira')).toHaveValue('Carteira de teste')

  // Confirmação no banco: os IDs foram mantidos e apenas os slots inverteram
  const after = await page.evaluate<Record<string, string | undefined>>(`(async () => {
    const records = await window.__kurioMock.stores.walletsStore.getByUserId('user-teste')
    const p = records.find((r) => r.slot === 'primary')
    const s = records.find((r) => r.slot === 'secondary')
    return { primaryId: p?.id, secondaryId: s?.id }
  })()`)

  expect(after.primaryId).toBe(before.secondaryId)
  expect(after.secondaryId).toBe(before.primaryId)
})
