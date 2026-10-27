/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, ready, scenarios, signInAs } from './helpers.ts'

async function openProfileData(page: Page) {
  await openApp(page)
  await signInAs(page, 'primary')
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Salvar' })

test.describe('Perfil — validação de dados, disponibilidade e conflitos 409 (13-050)', () => {
  test('1. Campo obrigatório vazio só acusa no envio; formato inválido ao sair do campo', async ({
    page,
  }) => {
    await openProfileData(page)

    const displayName = page.getByLabel('Nome de exibição')
    const username = page.getByLabel('Nome de usuário')
    const email = page.getByLabel('E-mail')
    const walletNickname = page.getByLabel('Apelido da carteira')
    const ensLabel = page.getByLabel('Nome ENS')

    // 1) Campos obrigatórios limpos não acusam erro apenas no blur (validação adiada).
    await displayName.fill('')
    await username.fill('')
    await email.fill('')
    await walletNickname.click()

    await expect(page.getByText('Informe um nome de exibição.')).toHaveCount(0)
    await expect(page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.')).toHaveCount(
      0,
    )
    await expect(page.getByText('Informe um e-mail.')).toHaveCount(0)

    // Acusam os erros obrigatórios apenas ao tentar enviar.
    await saveButton(page).click()
    await expect(page.getByText('Informe um nome de exibição.')).toBeVisible()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()
    await expect(page.getByText('Informe um e-mail.')).toBeVisible()

    // 2) Formato inválido acusa ao sair do campo (blur):
    // Nome de exibição até 40 caracteres.
    await displayName.fill('A'.repeat(41))
    await username.click()
    await expect(page.getByText('O nome de exibição deve ter até 40 caracteres.')).toBeVisible()
    await displayName.fill('Teste Kurio')
    await username.click()
    await expect(page.getByText('O nome de exibição deve ter até 40 caracteres.')).toHaveCount(0)

    // Nome de usuário entre 3 e 20 caracteres, letras, números, '_' e '.', sem espaços.
    await username.fill('ab')
    await displayName.click()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()

    await username.fill('A'.repeat(21))
    await displayName.click()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()

    await username.fill('usuario invalido')
    await displayName.click()
    await expect(
      page.getByText('Use apenas letras, números, "_" e ".", sem espaços.'),
    ).toBeVisible()
    await username.fill('teste')
    await displayName.click()
    await expect(page.getByText('Use apenas letras, números, "_" e ".", sem espaços.')).toHaveCount(
      0,
    )

    // E-mail inválido.
    await email.fill('invalido-sem-arroba')
    await displayName.click()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await email.fill('teste@kurio.test')
    await displayName.click()
    await expect(page.getByText('Informe um e-mail válido.')).toHaveCount(0)

    // Apelido da carteira até 30 caracteres.
    await walletNickname.fill('B'.repeat(31))
    await displayName.click()
    await expect(page.getByText('O apelido deve ter até 30 caracteres.')).toBeVisible()
    await walletNickname.fill('Carteira Principal')
    await displayName.click()
    await expect(page.getByText('O apelido deve ter até 30 caracteres.')).toHaveCount(0)

    // ENS: 3 a 63 minúsculas, números e hífen; sufixo fixo .eth.
    await expect(page.getByLabel('Sufixo ENS')).toHaveText('.eth')
    await ensLabel.fill('ab')
    await displayName.click()
    await expect(
      page.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
    ).toBeVisible()

    await ensLabel.fill('ENS_MAIUSCULO')
    await displayName.click()
    await expect(
      page.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
    ).toBeVisible()

    await ensLabel.fill('ens-valido')
    await displayName.click()
    await expect(page.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.')).toHaveCount(
      0,
    )
  })

  test('2. POST /auth/availability com falha não bloqueia; 409 EMAIL_TAKEN e USERNAME_TAKEN juntos com foco no primeiro campo; ignora próprio valor e caixa', async ({
    page,
  }) => {
    await scenarios(page, 'server-error:POST /auth/availability')
    await openProfileData(page)

    const username = page.getByLabel('Nome de usuário')
    const email = page.getByLabel('E-mail')

    // Digita um novo nome de usuário: a disponibilidade falha no mock (500), mas não bloqueia o campo.
    await username.fill('novo_usuario')
    await email.click()
    await expect(page.getByText('Este nome de usuário já está em uso')).toHaveCount(0)
    await expect(saveButton(page)).toBeEnabled()

    // 409 simultâneo: usuário "outro" e e-mail "outro@kurio.test" (pertencem ao outro usuário cadastrado no seed).
    // Testamos também a indiferença de maiúsculas/minúsculas ("OUTRO" e "OUTRO@KURIO.TEST").
    await username.fill('OUTRO')
    await email.fill('OUTRO@KURIO.TEST')

    await saveButton(page).click()
    const dialog = page.getByRole('dialog', { name: 'Confirme sua senha' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Senha atual').fill(users.primary.password)
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    // Ambos os campos exibem a mensagem de conflito 409 da API.
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    // O foco vai para o primeiro campo de conflito da resposta.
    await expect(email).toBeFocused()

    // O conflito ignora o próprio valor e caixa do usuário atual (não acusa conflito de si mesmo).
    await username.fill('TESTE')
    await email.fill('TESTE@KURIO.TEST')
    await saveButton(page).click()
    await expect(saveButton(page)).not.toHaveAttribute('aria-busy', 'true')
    await expect(saveButton(page)).toBeDisabled()
    await expect(page.getByText('Perfil atualizado').first()).toBeVisible()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toHaveCount(0)
    await expect(page.getByText('Este nome de usuário já está em uso.')).toHaveCount(0)
  })

  test('3. Limpar ENS e apelido (opcionais) grava vazio e persiste a refresh', async ({ page }) => {
    await openProfileData(page)

    // 1) Define valores para ENS e apelido.
    await page.getByLabel('Nome ENS').fill('colecionador-teste')
    await page.getByLabel('Apelido da carteira').fill('Minha Carteira')
    await expect(saveButton(page)).toBeEnabled()
    await saveButton(page).click()
    await expect(saveButton(page)).not.toHaveAttribute('aria-busy', 'true')
    await expect(saveButton(page)).toBeDisabled()

    // Valida no refresh que os dados foram gravados.
    await page.reload()
    await ready(page)
    await expect(page.getByLabel('Nome ENS')).toHaveValue('colecionador-teste')
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Minha Carteira')

    // 2) Agora limpa ambos os campos opcionais.
    await page.getByLabel('Nome ENS').fill('')
    await page.getByLabel('Apelido da carteira').fill('')
    await expect(saveButton(page)).toBeEnabled()
    await saveButton(page).click()
    await expect(saveButton(page)).not.toHaveAttribute('aria-busy', 'true')
    await expect(saveButton(page)).toBeDisabled()

    // Recarrega a página e valida persistência de valores vazios.
    await page.reload()
    await ready(page)
    await expect(page.getByLabel('Nome ENS')).toHaveValue('')
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('')
  })

  test('4. Perfil sem ENS, apelido e avatar renderiza sem lacunas', async ({ page }) => {
    await openProfileData(page)

    // Valores padrão do usuário sem ENS, sem apelido e sem avatar.
    await expect(page.getByLabel('Nome ENS')).toHaveValue('')
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Remover' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(page.getByRole('img', { name: 'Sua foto de perfil' })).toHaveCount(0)

    // O container principal renderiza os blocos sem alertas nem elementos quebrados.
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Alterar senha' })).toBeVisible()
    await expect(page.locator('#conteudo').getByRole('alert')).toHaveCount(0)
  })
})
