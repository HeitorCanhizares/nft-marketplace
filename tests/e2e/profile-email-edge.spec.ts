/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { openApp, ready, recordApi, signInAs } from './helpers.ts'

async function openProfileData(page: Page) {
  await openApp(page)
  await signInAs(page, 'primary')
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Salvar' })
const confirmDialog = (page: Page) => page.getByRole('dialog', { name: 'Confirme sua senha' })

test.describe('Perfil — confirmação de senha na troca de e-mail (13-051)', () => {
  test('1. INVALID_CURRENT_PASSWORD mantém diálogo aberto com erro e formulário intacto; Esc e Cancelar fecham e limpam; campo vazio só acusa ao enviar; clique repetido envia uma requisição', async ({
    page,
  }) => {
    await openProfileData(page)
    const emailField = page.getByLabel('E-mail')
    await emailField.fill('novo-email@kurio.test')

    // Abre o diálogo
    await saveButton(page).click()
    const dialog = confirmDialog(page)
    await expect(dialog).toBeVisible()

    const passwordField = dialog.getByLabel('Senha atual')
    const confirmButton = dialog.getByRole('button', { name: 'Confirmar' })
    const cancelButton = dialog.getByRole('button', { name: 'Cancelar' })

    // Campo vazio no diálogo só acusa ao enviar (useDeferredEmptyValidation).
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await confirmButton.click()
    await expect(dialog.getByRole('alert')).toHaveText('Informe sua senha atual.')

    // Teste de INVALID_CURRENT_PASSWORD: senha errada digitada.
    await passwordField.fill('senha-incorreta-123')
    await confirmButton.click()

    // O diálogo permanece aberto exibindo o erro do backend e o formulário no fundo segue intacto.
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveText('Senha atual incorreta.')
    await expect(passwordField).toBeFocused()
    await expect(emailField).toHaveValue('novo-email@kurio.test')

    // Fechar com Cancelar fecha o diálogo e limpa o campo/erro ao reabrir.
    await cancelButton.click()
    await expect(dialog).toBeHidden()
    await saveButton(page).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await expect(passwordField).toHaveValue('')

    // Fechar com Escape fecha o diálogo e limpa o campo/erro ao reabrir.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await saveButton(page).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveCount(0)

    // Clique repetido em "Confirmar": apenas uma requisição PATCH /profile é enviada.
    const api = recordApi(page)
    await passwordField.fill(users.primary.password)
    await confirmButton.click({ clickCount: 3 })
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Perfil atualizado').first()).toBeVisible()
    expect(api.calls('PATCH', '/profile')).toHaveLength(1)
  })

  test('2. 409 EMAIL_TAKEN depois da senha certa fecha o diálogo, mostra o erro no campo e-mail e aplica foco', async ({
    page,
  }) => {
    await openProfileData(page)
    const emailField = page.getByLabel('E-mail')

    // Informa o e-mail de outro usuário já cadastrado.
    await emailField.fill('outro@kurio.test')
    await saveButton(page).click()

    const dialog = confirmDialog(page)
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Senha atual').fill(users.primary.password)
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    // O diálogo fecha.
    await expect(dialog).toBeHidden()

    // Erro de e-mail em uso é mostrado no campo correspondente e recebe o foco.
    await expect(page.getByText(/^Este e-mail já está cadastrado/)).toBeVisible()
    await expect(emailField).toBeFocused()
  })
})
