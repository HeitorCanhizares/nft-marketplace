import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { announcements, authState, collectAnnouncements, ready } from './helpers.ts'

async function signIn(page: Page, user = users.primary) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(user)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openWallets(page: Page) {
  await signIn(page)
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
}

const primary = (page: Page) => page.getByRole('region', { name: 'Carteira principal' })
const secondary = (page: Page) => page.getByRole('region', { name: 'Carteira secundária' })
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })

async function expectNoSeriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  const serious = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
  expect(serious).toEqual([])
}

async function addSecondary(page: Page, nickname: string) {
  const section = secondary(page)
  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await section.getByLabel('Apelido da carteira').fill(nickname)
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
}

test('1. acessibilidade: axe sem violações com diálogos de remover e swap abertos e com erros em tela', async ({
  page,
}) => {
  await openWallets(page)
  await addSecondary(page, 'Secundária A11y')

  // 1a. Diálogo de remover aberto
  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const removeDialog = dialogOf(page, 'Remover carteira secundária?')
  await expect(removeDialog).toBeVisible()
  await expectNoSeriousViolations(page, ['aria-hidden-focus'])
  await removeDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(removeDialog).toBeHidden()

  // 1b. Diálogo de tornar principal aberto
  await secondary(page).getByRole('button', { name: 'Tornar principal' }).click()
  const swapDialog = dialogOf(page, 'Tornar principal?')
  await expect(swapDialog).toBeVisible()
  await expectNoSeriousViolations(page, ['aria-hidden-focus'])
  await swapDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(swapDialog).toBeHidden()

  // 1c. Erros de validação visíveis na tela
  const pSection = primary(page)
  await pSection.getByLabel('Endereço da carteira').fill('0x123')
  await pSection.getByLabel('E-mail').fill('invalido')
  await pSection.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(pSection.getByText('Endereço de carteira inválido.')).toBeVisible()
  await expect(pSection.getByText('Informe um e-mail válido.')).toBeVisible()
  await expectNoSeriousViolations(page)
})

test('2. anúncios e teclado: live regions para ações de carteiras e navegação por teclado em selects, rádios e diálogos', async ({
  page,
}) => {
  await openWallets(page)
  await collectAnnouncements(page)

  // 2a. Anúncio ao salvar carteira principal
  await primary(page).getByLabel('Apelido da carteira').fill('Principal Anúncio')
  await primary(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect.poll(async () => announcements(page)).toContain('Carteira principal salva')

  // 2b. Teclado em rádio e anúncio ao salvar carteira secundária
  const radio = secondary(page).getByRole('radio', { name: 'Igual à carteira principal' })
  await radio.focus()
  await page.keyboard.press('Space')
  await expect(radio).toBeChecked()

  await secondary(page).getByLabel('Apelido da carteira').fill('Secundária Anúncio')
  await secondary(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect.poll(async () => announcements(page)).toContain('Carteira secundária salva')

  // 2c. Teclado no Radix Select (Rede)
  const networkTrigger = primary(page).getByRole('combobox', { name: 'Rede' })
  await networkTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeHidden()
  // Volta a rede original: com alteração não salva, "Tornar principal" fica desativado (2e).
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('listbox')).toBeHidden()

  // 2d. Teclado no diálogo e Escape para fechar
  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const removeDialog = dialogOf(page, 'Remover carteira secundária?')
  await expect(removeDialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(removeDialog).toBeHidden()

  // 2e. Anúncio ao trocar carteiras
  await secondary(page).getByRole('button', { name: 'Tornar principal' }).click()
  const swapDialog = dialogOf(page, 'Tornar principal?')
  await swapDialog.getByRole('button', { name: 'Tornar principal' }).click()
  await expect.poll(async () => announcements(page)).toContain('Carteiras trocadas')

  // 2f. Anúncio ao remover carteira secundária
  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const removeConfirm = dialogOf(page, 'Remover carteira secundária?')
  await removeConfirm.getByRole('button', { name: 'Remover' }).click()
  await expect.poll(async () => announcements(page)).toContain('Carteira secundária removida')
})
