import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, openApp, ready, seedFigmaCart, seedOrder, useHandler } from '../e2e/helpers.ts'

const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve
            }),
      ),
    )
  })
  await page.mouse.move(0, 0)
}

async function blurActive(page: Page) {
  await page.evaluate(() => {
    const el = document.activeElement
    if (el instanceof HTMLElement) {
      el.blur()
    }
  })
}

async function signInPrimary(page: Page) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

test.describe('Perfil e Carteiras — estados visuais', () => {
  test('Perfil erro de validação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')

    await page.getByLabel('Nome de exibição').fill('')
    await page.getByLabel('Nome de usuário').fill('')
    await page.getByLabel('E-mail').fill('')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Informe um nome de exibição.')).toBeVisible()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()
    await expect(page.getByText('Informe um e-mail.')).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('perfil-validacao.png', { ...SHOT, fullPage: true })
  })

  test('Perfil diálogo de troca de e-mail', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    await page.goto('/perfil/dados')
    await ready(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')

    await page.getByLabel('E-mail').fill('novo-email@kurio.test')
    await page.getByRole('button', { name: 'Salvar' }).click()

    const dialog = page.getByRole('dialog', { name: 'Confirme sua senha' })
    await expect(dialog).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('perfil-dialogo-troca-email.png', SHOT)
  })

  test('Carteiras diálogo de remover secundária', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    await page.evaluate(`(async () => {
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      await window.__kurio.http.put('/wallets/secondary', {
        ...wallet,
        nickname: 'Reserva',
        network: 'polygon',
        ensName: 'nova-kurio.eth',
      })
    })()`)
    await page.goto('/perfil/carteiras')
    await ready(page)

    const removeBtn = page.getByRole('button', { name: 'Remover carteira secundária' })
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    const dialog = page.getByRole('dialog', { name: 'Remover carteira secundária?' })
    await expect(dialog).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('carteiras-dialogo-remover-secundaria.png', SHOT)
  })
})

test.describe('Pagamento — estados visuais', () => {
  test('Pagamento revisão aberta', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await seedFigmaCart(page)
    await signInPrimary(page)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento-revisao-aberta.png', SHOT)
  })

  test('Pagamento revisão com mudanças', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, 'price-change-on-checkout,fee-change-on-checkout')
    await seedFigmaCart(page)
    await signInPrimary(page)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByRole('heading', { name: 'Os valores mudaram' })).toBeVisible()
    await expect(
      review.getByRole('list', { name: 'Mudanças desde a última cotação' }),
    ).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento-revisao-mudancas.png', SHOT)
  })

  test('Pagamento revisão com erro', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await seedFigmaCart(page)
    await signInPrimary(page)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()

    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'server-error:POST /orders')`)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(review.getByRole('alert')).toBeVisible()
    await expect(review.getByRole('alert')).toContainText('Algo deu errado')

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento-revisao-erro.png', SHOT)
  })

  test('Pagamento conectando', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await ready(page)
    await seedFigmaCart(page)
    await signInPrimary(page)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.evaluate(`(() => {
      const orig = window.__kurio.walletRegistry.getWalletProvider()
      window.__kurio.walletRegistry.registerWalletProvider({
        ...orig,
        connect: () => new Promise(() => {}),
      })
    })()`)

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/^Conectando à MetaMask/)).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento-conectando.png', {
      ...SHOT,
      fullPage: true,
    })
  })

  test('Pagamento recusa de conexão', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, 'wallet-rejected')
    await seedFigmaCart(page)
    await signInPrimary(page)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText('Conexão recusada na carteira')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento-recusa-conexao.png', {
      ...SHOT,
      fullPage: true,
    })
  })
})

test.describe('Confirmação — estados visuais', () => {
  test('Confirmação pendente', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    const orderId = await seedOrder(page, { status: 'pending' })

    const baseOrder = await page.evaluate<string>(
      `(async () => JSON.stringify((await window.__kurio.http.get('/orders/${orderId}')).data))()`,
    )

    await useHandler(
      page,
      `
      worker.use(
        http.get('*/api/orders/${orderId}', () => {
          return HttpResponse.json(${baseOrder})
        })
      )
    `,
    )

    await page.evaluate(
      `void window.__kurio.router.navigate({ to: '/pedido/$orderId', params: { orderId: ${JSON.stringify(orderId)} } })`,
    )
    await ready(page)
    await expect(page.getByText('Confirmando pagamento...')).toBeVisible()
    await expect(page.getByText(/Aguardando a confirmação na rede/)).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('confirmacao-pendente.png', {
      ...SHOT,
      fullPage: !isDesktop(testInfo),
    })
  })

  test('Confirmação pendente com aviso de demora', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    const orderId = await seedOrder(page, { status: 'pending' })
    const oldCreatedAt = new Date(Date.now() - 65_000).toISOString()

    const baseOrderJson = await page.evaluate<string>(
      `(async () => JSON.stringify((await window.__kurio.http.get('/orders/${orderId}')).data))()`,
    )

    await useHandler(
      page,
      `
      worker.use(
        http.get('*/api/orders/${orderId}', () => {
          const base = ${baseOrderJson}
          return HttpResponse.json({ ...base, status: 'pending', createdAt: '${oldCreatedAt}' })
        })
      )
    `,
    )

    await page.evaluate(
      `void window.__kurio.router.navigate({ to: '/pedido/$orderId', params: { orderId: ${JSON.stringify(orderId)} } })`,
    )
    await ready(page)
    await expect(
      page.getByText(
        'Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado.',
      ),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('confirmacao-pendente-demora.png', {
      ...SHOT,
      fullPage: !isDesktop(testInfo),
    })
  })

  test('Confirmação recusado', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)
    const orderId = await seedOrder(page, {
      status: 'declined',
      declineReason: 'Pagamento recusado pela carteira simulada.',
    })

    await page.evaluate(
      `void window.__kurio.router.navigate({ to: '/pedido/$orderId', params: { orderId: ${JSON.stringify(orderId)} } })`,
    )
    await ready(page)
    await expect(page.getByRole('heading', { level: 2, name: 'Pagamento recusado' })).toBeVisible()
    await expect(page.getByText('Pagamento recusado pela carteira simulada.')).toBeVisible()
    await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('confirmacao-recusado.png', {
      ...SHOT,
      fullPage: !isDesktop(testInfo),
    })
  })

  test('Confirmação 403', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page, 'forbidden-order')
    await signInPrimary(page)
    const orderId = await seedOrder(page, { status: 'confirmed' })

    await page.evaluate(
      `void window.__kurio.router.navigate({ to: '/pedido/$orderId', params: { orderId: ${JSON.stringify(orderId)} } })`,
    )
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Este pedido pertence a outra conta.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar para o início' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('confirmacao-403.png', { ...SHOT, fullPage: true })
  })

  test('Confirmação 404', async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await signInPrimary(page)

    await page.goto('/pedido/ord-inexistente-404')
    await ready(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Pedido não encontrado' }),
    ).toBeVisible()
    await expect(
      page.getByText('O pedido que você procura não existe ou foi removido.'),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar para o início' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    await expect(page).toHaveScreenshot('confirmacao-404.png', { ...SHOT, fullPage: true })
  })
})

test.describe('Auth — estados visuais', () => {
  test('Login erro de servidor', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:POST /auth/login')`,
    )
    await page.goto('/entrar')
    await ready(page)

    const form = isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(form.getByText(/Não foi possível entrar agora/)).toBeVisible()
    await expect(form.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    if (isDesktop(testInfo)) {
      await expect(page.getByRole('dialog')).toHaveScreenshot('login-erro-servidor.png', SHOT)
    } else {
      await expect(page).toHaveScreenshot('login-erro-servidor.png', SHOT)
    }
  })

  test('Cadastro erro de servidor', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:POST /auth/register')`,
    )
    await page.goto('/cadastro')
    await ready(page)

    const form = isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
    await form.getByLabel('Nome de usuário').fill('novo_usuario')
    await form.getByLabel('E-mail').fill('novo@kurio.test')
    await form.getByLabel('Senha', { exact: true }).fill('SenhaSegura123')
    await form.getByLabel('Confirmar senha').fill('SenhaSegura123')

    const submitBtn = form.getByRole('button', {
      name: isDesktop(testInfo) ? 'Criar conta' : 'Criar perfil',
      exact: true,
    })
    await submitBtn.click()

    await expect(form.getByText(/Não foi possível criar a conta agora/)).toBeVisible()
    await expect(form.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    await blurActive(page)
    await settle(page)
    if (isDesktop(testInfo)) {
      await expect(page.getByRole('dialog')).toHaveScreenshot('cadastro-erro-servidor.png', SHOT)
    } else {
      await expect(page).toHaveScreenshot('cadastro-erro-servidor.png', SHOT)
    }
  })
})
