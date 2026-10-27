/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import {
  announcements,
  authState,
  collectAnnouncements,
  openApp,
  ready,
  signInAs,
} from './helpers.ts'

async function openProfileData(page: Page) {
  await openApp(page)
  await signInAs(page, 'primary')
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Salvar' })
const currentPasswordField = (page: Page) => page.getByLabel('Senha atual', { exact: true })
const newPasswordField = (page: Page) => page.getByLabel('Nova senha', { exact: true })
const confirmPasswordField = (page: Page) => page.getByLabel('Confirmar nova senha')

test.describe('Perfil — troca de senha, validações e revogação de outras sessões (13-053)', () => {
  test('1. Campos de senha interdependentes, confirmação diferente, nova igual à atual (front e 422 mock); requisitos sem anúncio por tecla', async ({
    page,
  }) => {
    await openProfileData(page)

    // 1) Só um dos campos preenchido acusa os outros como obrigatórios no envio
    // Apenas Senha atual preenchida:
    await currentPasswordField(page).fill(users.primary.password)
    await saveButton(page).click()
    await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()
    await expect(page.getByText('Confirme a nova senha.')).toBeVisible()

    // Apenas Nova senha preenchida:
    await currentPasswordField(page).fill('')
    await newPasswordField(page).fill('Novasenha123')
    await saveButton(page).click()
    await expect(page.getByText('Informe sua senha atual.')).toBeVisible()
    await expect(page.getByText('Confirme a nova senha.')).toBeVisible()

    // Apenas Confirmar nova senha preenchida:
    await newPasswordField(page).fill('')
    await confirmPasswordField(page).fill('Novasenha123')
    await saveButton(page).click()
    await expect(page.getByText('Informe sua senha atual.')).toBeVisible()
    await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible()

    // 2) Confirmação diferente da nova senha
    await currentPasswordField(page).fill(users.primary.password)
    await newPasswordField(page).fill('Novasenha123')
    await confirmPasswordField(page).fill('Outrasenha999')
    await saveButton(page).click()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    // 3) Nova senha igual à senha atual (front)
    await currentPasswordField(page).fill(users.primary.password)
    await newPasswordField(page).fill(users.primary.password)
    await confirmPasswordField(page).fill(users.primary.password)
    await saveButton(page).click()
    await expect(page.getByText('A nova senha deve ser diferente da atual.')).toBeVisible()

    // 4) Chamada direta ao mock (422) quando nova senha é igual à atual
    const samePasswordOutcome = await page.evaluate(async (pwd) => {
      const raw = localStorage.getItem('kurio:session')
      const session = raw ? (JSON.parse(raw) as { token?: string }) : null
      const token = session?.token ?? ''
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: pwd, newPassword: pwd }),
      })
      const body = (await res.json()) as {
        error?: { code?: string; fields?: { newPassword?: string } }
      }
      return { status: res.status, body }
    }, users.primary.password)
    expect(samePasswordOutcome.status).toBe(422)
    expect(samePasswordOutcome.body.error?.fields?.newPassword).toBe(
      'A nova senha deve ser diferente da atual.',
    )

    // 5) Digitar no campo de nova senha não dispara anúncios a cada tecla
    await currentPasswordField(page).fill('')
    await newPasswordField(page).fill('')
    await confirmPasswordField(page).fill('')
    await collectAnnouncements(page)
    await newPasswordField(page).pressSequentially('NovaSenha123')
    expect(await announcements(page)).toEqual([])
  })

  test('2. INVALID_CURRENT_PASSWORD mostra erro em "Senha atual" e foca o campo', async ({
    page,
  }) => {
    await openProfileData(page)

    await currentPasswordField(page).fill('senha-atual-errada')
    await newPasswordField(page).fill('Novasenha123')
    await confirmPasswordField(page).fill('Novasenha123')

    await saveButton(page).click()

    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
    await expect(currentPasswordField(page)).toBeFocused()
  })

  test('3. Sucesso encerra outras sessões do usuário, mantém a atual, login com nova senha funciona e anuncia "Senha alterada"', async ({
    page,
  }) => {
    await openProfileData(page)

    // Cria uma segunda sessão para o mesmo usuário no banco do mock
    await page.evaluate(`(async () => {
      await window.__kurioMock.stores.sessionsStore.put({
        token: 'sessao-secundaria',
        userId: 'user-teste',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
    })()`)

    // Confere que a sessão secundária é válida antes da troca de senha
    const statusBefore = await page.evaluate(async () => {
      const res = await fetch('/api/profile', {
        headers: { Authorization: 'Bearer sessao-secundaria' },
      })
      return res.status
    })
    expect(statusBefore).toBe(200)

    // Altera a senha
    await collectAnnouncements(page)
    await currentPasswordField(page).fill(users.primary.password)
    await newPasswordField(page).fill('Novasenha123')
    await confirmPasswordField(page).fill('Novasenha123')
    await saveButton(page).click()

    await expect(page.getByText('Senha alterada').first()).toBeVisible()
    expect(await announcements(page)).toContain('Senha alterada')

    // Sessão atual continua autenticada
    expect((await authState(page)).status).toBe('authenticated')

    // A sessão secundária foi encerrada (retorna 401)
    const statusAfter = await page.evaluate(async () => {
      const res = await fetch('/api/profile', {
        headers: { Authorization: 'Bearer sessao-secundaria' },
      })
      return res.status
    })
    expect(statusAfter).toBe(401)

    // Login com a nova senha funciona
    const newLoginStatus = await page.evaluate(
      async (creds) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        })
        return res.status
      },
      { email: users.primary.email, password: 'Novasenha123' },
    )
    expect(newLoginStatus).toBe(200)

    // Login com a senha antiga falha
    const oldLoginStatus = await page.evaluate(
      async (creds) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        })
        return res.status
      },
      { email: users.primary.email, password: users.primary.password },
    )
    expect(oldLoginStatus).toBe(401)
  })
})
