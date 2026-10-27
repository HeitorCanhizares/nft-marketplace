import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, delayApi, ready, recordApi, useHandler } from './helpers.ts'

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

async function addSecondary(page: Page, nickname: string) {
  const section = secondary(page)
  await section.getByRole('radio', { name: 'Igual à carteira principal' }).click()
  await section.getByLabel('Apelido da carteira').fill(nickname)
  await section.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
}

test('1. validation-error da API mapeia campos, preserva formulário e limpa ao editar', async ({
  page,
}) => {
  await openWallets(page)
  const section = primary(page)

  await useHandler(
    page,
    `worker.use(http.put('/api/wallets/primary', () => HttpResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revise os dados informados.',
          details: {},
          fields: {
            address: 'Endereço recusado pelo servidor.',
            ensName: 'Nome ENS indisponível.',
            email: 'E-mail em uso.',
          },
        },
      },
      { status: 422 },
    )))`,
  )

  await section.getByLabel('Apelido da carteira').fill('Apelido modificado')
  await section.getByRole('button', { name: 'Salvar carteira' }).click()

  // Erros exibidos nos campos corretos
  await expect(section.getByText('Endereço recusado pelo servidor.')).toBeVisible()
  await expect(section.getByText('Nome ENS indisponível.')).toBeVisible()
  await expect(section.getByText('E-mail em uso.')).toBeVisible()

  // O primeiro campo com erro da API recebe o foco
  await expect(section.getByLabel('Endereço da carteira')).toBeFocused()

  // Valores preenchidos são preservados
  await expect(section.getByLabel('Apelido da carteira')).toHaveValue('Apelido modificado')

  // Ao editar um campo, o erro específico daquele campo desaparece
  await section.getByLabel('Endereço da carteira').pressSequentially('0')
  await expect(section.getByText('Endereço recusado pelo servidor.')).toBeHidden()
  await expect(section.getByText('Nome ENS indisponível.')).toBeVisible()

  await section.getByLabel('Nome ENS').pressSequentially('x')
  await expect(section.getByText('Nome ENS indisponível.')).toBeHidden()
  await expect(section.getByText('E-mail em uso.')).toBeVisible()
})

test('2. falha 500 exibe mensagem no topo preservando dados e os formulários são independentes', async ({
  page,
}) => {
  await openWallets(page)
  await addSecondary(page, 'Secundária OK')

  // Falha 500 apenas na carteira principal
  await useHandler(
    page,
    `worker.use(http.put('/api/wallets/primary', () => HttpResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } },
      { status: 500 },
    )))`,
  )

  const pSection = primary(page)
  await pSection.getByLabel('Apelido da carteira').fill('Principal com Erro')
  await pSection.getByRole('button', { name: 'Salvar carteira' }).click()

  // Mensagem genérica no topo da seção principal
  await expect(pSection.getByRole('alert')).toHaveText(
    'Não foi possível salvar. Verifique sua conexão e tente novamente.',
  )
  await expect(pSection.getByLabel('Apelido da carteira')).toHaveValue('Principal com Erro')

  // Secundária continua independente e salva com sucesso
  const sSection = secondary(page)
  await sSection.getByLabel('Apelido da carteira').fill('Secundária Atualizada')
  await sSection.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira secundária salva').first()).toBeVisible()
  await expect(sSection.getByLabel('Apelido da carteira')).toHaveValue('Secundária Atualizada')

  // Erro na principal continua visível até sua edição
  await expect(pSection.getByRole('alert')).toBeVisible()
  await pSection.getByLabel('Apelido da carteira').pressSequentially('!')
  await expect(pSection.getByRole('alert')).toBeHidden()
})

test('3. DELETE e swap com 404 mantêm o diálogo aberto com mensagem de erro', async ({ page }) => {
  await openWallets(page)
  await addSecondary(page, 'Secundária Temporária')

  // 3a. Falha 404 em DELETE /wallets/secondary
  await useHandler(
    page,
    `worker.use(http.delete('/api/wallets/secondary', () => HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Carteira não encontrada.' } },
      { status: 404 },
    )))`,
  )

  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const removeDialog = dialogOf(page, 'Remover carteira secundária?')
  await removeDialog.getByRole('button', { name: 'Remover' }).click()

  // Diálogo permanece aberto com erro
  await expect(removeDialog).toBeVisible()
  await expect(removeDialog.getByRole('alert')).toHaveText(
    'Não foi possível concluir. Tente novamente.',
  )
  await removeDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(removeDialog).toBeHidden()

  // 3b. Falha 404 em POST /wallets/swap
  await useHandler(
    page,
    `worker.use(http.post('/api/wallets/swap', () => HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Carteira não encontrada.' } },
      { status: 404 },
    )))`,
  )

  await secondary(page).getByRole('button', { name: 'Tornar principal' }).click()
  const swapDialog = dialogOf(page, 'Tornar principal?')
  await swapDialog.getByRole('button', { name: 'Tornar principal' }).click()

  // Diálogo permanece aberto com erro
  await expect(swapDialog).toBeVisible()
  await expect(swapDialog.getByRole('alert')).toHaveText(
    'Não foi possível concluir. Tente novamente.',
  )
  await swapDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(swapDialog).toBeHidden()
})

test('4. cliques repetidos disparam apenas uma requisição para salvar, remover e trocar', async ({
  page,
}) => {
  await openWallets(page)
  const api = recordApi(page)

  // 4a. Salvar carteira: duplo clique dispara apenas uma requisição
  await delayApi(page, '**/api/wallets/primary', 500, { once: true })
  const pSection = primary(page)
  await pSection.getByLabel('Apelido da carteira').fill('Clique Único')

  const saveBtn = pSection.getByRole('button', { name: 'Salvar carteira' })
  await saveBtn.dblclick()
  await expect(page.getByText('Carteira principal salva').first()).toBeVisible()
  expect(api.calls('PUT', '/wallets/primary').length).toBe(1)

  // 4b. Adiciona secundária para testar remover e trocar
  api.clear()
  await addSecondary(page, 'Secundária Trava')

  // 4c. Tornar principal: duplo clique dispara apenas uma requisição
  api.clear()
  await delayApi(page, '**/api/wallets/swap', 500, { once: true })
  await secondary(page).getByRole('button', { name: 'Tornar principal' }).click()
  const swapDialog = dialogOf(page, 'Tornar principal?')
  const swapBtn = swapDialog.getByRole('button', { name: 'Tornar principal' })
  await swapBtn.dblclick()
  await expect(swapDialog).toBeHidden()
  await expect(page.getByText('Carteiras trocadas').first()).toBeVisible()
  expect(api.calls('POST', '/wallets/swap').length).toBe(1)

  // 4d. Remover secundária: duplo clique dispara apenas uma requisição
  api.clear()
  await delayApi(page, '**/api/wallets/secondary', 500, { once: true })
  await secondary(page).getByRole('button', { name: 'Remover carteira secundária' }).click()
  const removeDialog = dialogOf(page, 'Remover carteira secundária?')
  const removeBtn = removeDialog.getByRole('button', { name: 'Remover' })
  await removeBtn.dblclick()
  await expect(removeDialog).toBeHidden()
  await expect(page.getByText('Carteira secundária removida').first()).toBeVisible()
  expect(api.calls('DELETE', '/wallets/secondary').length).toBe(1)
})
