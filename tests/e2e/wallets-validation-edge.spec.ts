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

test('1. endereço: rejeita 39 e 41 caracteres, sem 0x e não hexadecimal; aceita maiúsculas e minúsculas', async ({
  page,
}) => {
  await openWallets(page)
  const section = primary(page)
  const addressInput = section.getByLabel('Endereço da carteira')
  const outside = section.getByLabel('Nome de exibição')

  // 39 caracteres (falta 1 caractere)
  await addressInput.fill(`0x${'a'.repeat(37)}`)
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()

  // 41 caracteres (passa 1 caractere)
  await addressInput.fill(`0x${'a'.repeat(39)}`)
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()

  // Sem prefixo 0x (42 caracteres hexadecimais)
  await addressInput.fill('1'.repeat(42))
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()

  // Caractere não hexadecimal (g)
  await addressInput.fill(`0x${'g'.repeat(40)}`)
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()

  // Válido tudo minúsculo
  await addressInput.fill(`0x${'a'.repeat(40)}`)
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeHidden()

  // Válido tudo maiúsculo
  await addressInput.fill(`0x${'A'.repeat(40)}`)
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeHidden()

  // Válido misto (checksum padrão)
  await addressInput.fill('0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C')
  await outside.click()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeHidden()
})

test('2. ENS ou carteira secundária: aceita 0x e .eth válidos, rejeita inválido; valida formato de e-mail', async ({
  page,
}) => {
  await openWallets(page)
  const section = primary(page)
  const secondaryInput = section.getByLabel('ENS ou carteira secundária')
  const emailInput = section.getByLabel('E-mail')
  const outside = section.getByLabel('Nome de exibição')

  // 0x válido
  await secondaryInput.fill(`0x${'1'.repeat(40)}`)
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeHidden()

  // nome.eth válido
  await secondaryInput.fill('colecionador.eth')
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeHidden()

  // Texto arbitrário inválido
  await secondaryInput.fill('invalido')
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeVisible()

  // ENS curto demais (< 3 caracteres antes do .eth)
  await secondaryInput.fill('ab.eth')
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeVisible()

  // 0x incompleto
  await secondaryInput.fill('0x123')
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeVisible()

  // Limpar campo opcional não deixa erro
  await secondaryInput.fill('')
  await outside.click()
  await expect(section.getByText('Use um endereço 0x ou um nome .eth.')).toBeHidden()

  // E-mail inválido
  await emailInput.fill('email-invalido')
  await outside.click()
  await expect(section.getByText('Informe um e-mail válido.')).toBeVisible()

  await emailInput.fill('teste@')
  await outside.click()
  await expect(section.getByText('Informe um e-mail válido.')).toBeVisible()

  // E-mail válido
  await emailInput.fill('teste@kurio.test')
  await outside.click()
  await expect(section.getByText('Informe um e-mail válido.')).toBeHidden()
})

test('3. limites: comprimento máximo nos campos de texto e formato do código de indicação e ENS', async ({
  page,
}) => {
  await openWallets(page)
  const section = primary(page)
  const heading = section.getByRole('heading', { name: 'Carteira principal' })

  // Nome de exibição: limite 40 caracteres
  const displayName = section.getByLabel('Nome de exibição')
  await displayName.fill('a'.repeat(41))
  await heading.click()
  await expect(section.getByText('O nome de exibição deve ter até 40 caracteres.')).toBeVisible()
  await displayName.fill('a'.repeat(40))
  await heading.click()
  await expect(section.getByText('O nome de exibição deve ter até 40 caracteres.')).toBeHidden()

  // Apelido da carteira: limite 30 caracteres
  const nickname = section.getByLabel('Apelido da carteira')
  await nickname.fill('b'.repeat(31))
  await heading.click()
  await expect(section.getByText('O apelido deve ter até 30 caracteres.')).toBeVisible()
  await nickname.fill('b'.repeat(30))
  await heading.click()
  await expect(section.getByText('O apelido deve ter até 30 caracteres.')).toBeHidden()

  // Nome do perfil: limite 40 caracteres
  const profileName = section.getByLabel('Nome do perfil')
  await profileName.fill('c'.repeat(41))
  await heading.click()
  await expect(section.getByText('O nome do perfil deve ter até 40 caracteres.')).toBeVisible()
  await profileName.fill('c'.repeat(40))
  await heading.click()
  await expect(section.getByText('O nome do perfil deve ter até 40 caracteres.')).toBeHidden()

  // Código de indicação: entre 3 e 20, apenas letras, números, _ e -
  const referral = section.getByLabel('Código de indicação')
  await referral.fill('ab')
  await heading.click()
  await expect(
    section.getByText('O código de indicação deve ter entre 3 e 20 caracteres.'),
  ).toBeVisible()

  await referral.fill('a'.repeat(21))
  await heading.click()
  await expect(
    section.getByText('O código de indicação deve ter entre 3 e 20 caracteres.'),
  ).toBeVisible()

  await referral.fill('CODIGO COM ESPACO')
  await heading.click()
  await expect(
    section.getByText('Use apenas letras, números, "_" e "-", sem espaços.'),
  ).toBeVisible()

  await referral.fill('VALIDO_123-ABC')
  await heading.click()
  await expect(
    section.getByText('Use apenas letras, números, "_" e "-", sem espaços.'),
  ).toBeHidden()
  await expect(
    section.getByText('O código de indicação deve ter entre 3 e 20 caracteres.'),
  ).toBeHidden()

  // Nome ENS: entre 3 e 63, letras minúsculas, números e hífens
  const ens = section.getByLabel('Nome ENS')
  await ens.fill('ab')
  await heading.click()
  await expect(
    section.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
  ).toBeVisible()

  await ens.fill('a'.repeat(64))
  await heading.click()
  await expect(
    section.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
  ).toBeVisible()

  await ens.fill('NomeComMaiusculas')
  await heading.click()
  await expect(
    section.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
  ).toBeVisible()

  await ens.fill('valido-ens-123')
  await heading.click()
  await expect(
    section.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
  ).toBeHidden()
})

test('4. obrigatórios: campo vazio só acusa no envio, valida selects e foca o primeiro campo inválido', async ({
  page,
}) => {
  await openWallets(page, users.other)
  const section = primary(page)

  // Sair de um campo vazio não exibe erro de obrigatório prematuramente
  const profileName = section.getByLabel('Nome do perfil')
  await profileName.focus()
  await profileName.blur()
  await expect(section.getByText('Informe o nome do perfil.')).toBeHidden()

  // Preenche um campo para habilitar o botão de envio
  await section.getByLabel('Apelido da carteira').fill('Nova')
  await section.getByRole('button', { name: 'Salvar carteira' }).click()

  // Erros de selects obrigatórios
  await expect(section.getByText('Selecione uma rede.')).toBeVisible()
  await expect(section.getByText('Selecione uma carteira.')).toBeVisible()

  // Erros de campos de texto obrigatórios vazios
  await expect(section.getByText('Informe o nome do perfil.')).toBeVisible()
  await expect(section.getByText('Endereço de carteira inválido.')).toBeVisible()
  await expect(section.getByText('Informe o código de indicação.')).toBeVisible()
  await expect(section.getByText('Informe o nome ENS.')).toBeVisible()

  // Foco automático no primeiro campo inválido
  const firstInvalid = section.locator('[aria-invalid="true"]').first()
  await expect(firstInvalid).toBeFocused()
})
