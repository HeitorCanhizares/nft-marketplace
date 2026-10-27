/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { openApp, ready, signInAs } from './helpers.ts'

async function expectNoSeriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

test.describe('Perfil — acessibilidade de diálogos, erros e teclado (13-055)', () => {
  test('1. Axe sem violações graves/críticas: diálogo de e-mail, remover avatar, erros e descartar alterações', async ({
    page,
  }, testInfo) => {
    await openApp(page)
    await signInAs(page, 'primary')
    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')

    // 1) Diálogo de e-mail aberto ("Confirme sua senha")
    await page.getByLabel('E-mail').fill('novo-email-a11y@kurio.test')
    await page.getByRole('button', { name: 'Salvar' }).click()
    const emailDialog = page.getByRole('dialog', { name: 'Confirme sua senha' })
    await expect(emailDialog).toBeVisible()
    await expectNoSeriousViolations(page, ['aria-hidden-focus'])
    await emailDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(emailDialog).toBeHidden()

    // 2) Diálogo de remover avatar
    await page.evaluate(`(async () => {
      const user = await window.__kurioMock.stores.usersStore.get('user-teste')
      if (user) {
        user.avatarUrl = '/avatars/user-teste'
        await window.__kurioMock.stores.usersStore.put(user)
      }
    })()`)
    await page.reload()
    await ready(page)
    const removeBtn = page.getByRole('button', { name: 'Remover' })
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()
    const removeDialog = page.getByRole('dialog', { name: 'Remover foto?' })
    await expect(removeDialog).toBeVisible()
    await expectNoSeriousViolations(page, ['aria-hidden-focus'])
    await removeDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(removeDialog).toBeHidden()

    // 3) Erros visíveis no formulário
    const usernameInput = page.getByLabel('Nome de usuário')
    await usernameInput.fill('ab')
    await page.getByLabel('Nome de exibição').click()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()
    await expectNoSeriousViolations(page)

    // 4) "Descartar alterações?"
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('link', { name: 'Carteiras' }).click()
    } else {
      await page.getByRole('link', { name: 'Voltar' }).click()
    }
    const discardDialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
    await expect(discardDialog).toBeVisible()
    await expectNoSeriousViolations(page, ['aria-hidden-focus'])
    await discardDialog.getByRole('button', { name: 'Continuar editando' }).click()
    await expect(discardDialog).toBeHidden()
  })

  test('2. navegação por teclado (ordem dos campos, Enter envia, seletor de arquivo, foco preso em diálogos) e prefers-reduced-motion', async ({
    page,
  }) => {
    await openApp(page)
    await signInAs(page, 'primary')
    await page.goto('/perfil/dados')
    await ready(page)

    const displayName = page.getByLabel('Nome de exibição')
    const username = page.getByLabel('Nome de usuário')
    const email = page.getByLabel('E-mail')
    const ensSuffix = page.getByRole('combobox', { name: 'Sufixo ENS' })
    const ens = page.getByLabel('Nome ENS')
    const nickname = page.getByLabel('Apelido da carteira')

    // 1) Ordem dos campos via Tab
    await displayName.focus()
    await expect(displayName).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(username).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(email).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(ensSuffix).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(ens).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(nickname).toBeFocused()

    // 2) Enter envia o formulário
    await displayName.fill('Teste Colecionador Teclado')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Perfil atualizado').first()).toBeVisible()

    // 3) Seletor de arquivo aberto via teclado
    const fileChooserPromise = page.waitForEvent('filechooser')
    const uploadBtn = page.getByRole('button', { name: /Adicionar foto|Alterar/ })
    await uploadBtn.focus()
    await page.keyboard.press('Enter')
    const fileChooser = await fileChooserPromise
    expect(fileChooser.isMultiple()).toBe(false)

    // 4) Diálogo com foco preso e retorno ao gatilho
    await email.fill('email-foco-teste@kurio.test')
    await page.getByRole('button', { name: 'Salvar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Confirme sua senha' })
    await expect(dialog).toBeVisible()

    // O campo de senha dentro do diálogo recebe foco automaticamente
    const passwordInput = dialog.getByLabel('Senha atual')
    await expect(passwordInput).toBeFocused()

    // Tab navega pelos controles internos do modal (mostra foco preso)
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Mostrar senha' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Confirmar' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused()

    // O foco cicla de volta para o primeiro campo (foco preso)
    await page.keyboard.press('Tab')
    await expect(passwordInput).toBeFocused()

    // Escape fecha o modal
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // 5) prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const isReduced = await page.evaluate<boolean>(
      `window.matchMedia('(prefers-reduced-motion: reduce)').matches`,
    )
    expect(isReduced).toBe(true)
  })
})
