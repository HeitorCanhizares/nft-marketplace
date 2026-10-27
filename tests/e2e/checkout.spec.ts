import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, seedFigmaCart } from './helpers.ts'

// Pagamento: só o caminho principal. Casos de borda ficam para a fase 13 (11-020).

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

const OTHER_ADDRESS = '0x1111111111111111111111111111111111111111'
const CONNECTED = 'Conectada: 0xA91F…E82C'

type Credentials = { email: string; password: string }

/** Carrinho do Figma como visitante; só depois entra (o login mescla o carrinho). */
async function signInWithCart(page: Page, user: Credentials = users.primary) {
  await page.goto('/')
  await ready(page)
  await seedFigmaCart(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(user)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openCheckout(page: Page) {
  await signInWithCart(page)
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

test('entrada: carrinho vazio leva ao carrinho', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.goto('/pagamento')
  await expect(page).toHaveURL(/\/carrinho$/)
})

test('desktop: fluxo completo até o pedido', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  test.setTimeout(60_000)
  await openCheckout(page)

  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
    '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
  )
  await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  await expect(page.getByText('(x 2)')).toBeVisible()

  await page.getByRole('button', { name: 'Tem um código promocional? Aplique aqui' }).click()
  await page.getByLabel('Código promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom KURIO10 aplicado').first()).toBeVisible()

  // Sem carteira conectada, a revisão não abre.
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(
    page.locator('p[role="alert"]', { hasText: 'Conecte uma carteira para continuar.' }),
  ).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toHaveCount(0)

  // Conecta na rede do formulário (Ethereum).
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText('Conectando à MetaMask...')).toBeVisible()
  await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

  // Rede do formulário em Polygon: a taxa muda e a conexão pede a troca.
  await page.getByRole('combobox', { name: /^Rede/ }).click()
  await page.getByRole('option', { name: 'Polygon' }).click()
  await expect(page.getByText('0.002 ETH').first()).toBeVisible()
  await page.getByRole('button', { name: 'Trocar para Polygon' }).click()
  await expect(page.getByRole('button', { name: 'Trocar para Polygon' })).toHaveCount(0)
  await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  await expect(review.getByText('Emerald Ape #042')).toBeVisible()
  await expect(review.getByText('Total').first()).toBeVisible()

  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/pedido\/[^/]+$/)

  // Pedido pendente: voltar ao pagamento leva de novo ao pedido.
  const orderUrl = page.url()
  await page.goto('/pagamento')
  await expect(page).toHaveURL(orderUrl)
})

test('desktop: outra carteira salva como secundária', async ({ page }, testInfo) => {
  only(testInfo, 'desktop')
  test.setTimeout(60_000)
  await openCheckout(page)

  await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).click()
  await page.getByRole('radio', { name: 'Preencher outra carteira' }).click()
  await expect(page.getByLabel('Endereço da carteira')).toHaveValue('')

  await page.getByLabel('Nome de exibição').fill('Colecionador Dois')
  await page.getByLabel('Nome de usuário').fill('colecionador2')
  await page.getByRole('combobox', { name: /^Rede/ }).click()
  await page.getByRole('option', { name: 'Ethereum' }).click()
  await page.getByLabel('Nome do perfil').fill('Perfil Dois')
  await page.getByLabel('Endereço da carteira').fill(OTHER_ADDRESS)
  await page.getByLabel('Tipo de carteira').click()
  await page.getByRole('option', { name: 'MetaMask' }).click()
  await page.getByLabel('Código de indicação').fill('DOIS2')
  await page.getByRole('textbox', { name: /^E-mail \(obrigatório\)/ }).fill('dois@kurio.test')
  await page.getByLabel('Nome ENS').fill('dois')
  await page.getByRole('checkbox', { name: 'Salvar como carteira secundária' }).click()

  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/pedido\/[^/]+$/)

  const secondary = await page.evaluate(`(async () => {
    const res = await window.__kurio.http.get('/wallets')
    return res.data.secondary
  })()`)
  expect(secondary).toMatchObject({ address: OTHER_ADDRESS })
})

test('mobile: carteira salva, edição, conexão e pedido', async ({ page }, testInfo) => {
  only(testInfo, 'mobile')
  test.setTimeout(60_000)
  await openCheckout(page)

  await expect(page.getByRole('heading', { name: 'Carteira conectada' })).toBeVisible()
  const primary = page.getByRole('radio', { name: 'Carteira de teste' })
  await expect(primary).toBeChecked()
  await expect(page.getByText('Rede principal Ethereum')).toBeVisible()
  await expect(page.getByLabel('Nome de exibição')).toHaveCount(0)

  await page.getByRole('button', { name: 'Opções da carteira Carteira de teste' }).click()
  await page.getByRole('menuitem', { name: 'Editar carteira' }).click()
  await expect(page).toHaveURL(/\/perfil\/carteiras\?redirect=(%2F|\/)pagamento$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/pagamento$/)

  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(review).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/pedido\/[^/]+$/)
})
