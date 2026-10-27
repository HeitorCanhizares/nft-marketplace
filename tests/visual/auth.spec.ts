import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from '../e2e/fixtures.ts'
import { authState, ready } from '../e2e/helpers.ts'

// Regressão visual do Login e do Cadastro. No desktop compara a caixa do modal (a Início real é
// da fase 06); no mobile, a página no viewport do projeto (414x896) e o Cadastro em 320x700.
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

// Fontes e imagens carregadas, mouse fora da tela (sem hover).
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((img) =>
        // Imagens preguiçosas fora da tela podem nunca carregar (relógio pausado).
        img.complete || img.loading === 'lazy'
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

async function go(page: Page, path: string, scenarios?: string) {
  if (scenarios !== undefined) {
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`,
    )
  }
  await page.goto(path)
  await ready(page)
  await settle(page)
}

async function blurActive(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await settle(page)
  if (isDesktop(testInfo)) {
    await expect(page.getByRole('dialog')).toHaveScreenshot(`${name}.png`, SHOT)
  } else {
    await expect(page).toHaveScreenshot(`${name}.png`, SHOT)
  }
}

function scope(page: Page, testInfo: TestInfo): Locator {
  return isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
}

const password = (form: Locator) => form.getByLabel('Senha', { exact: true })
const loginButton = (form: Locator) => form.getByRole('button', { name: 'Entrar', exact: true })
const signupButton = (form: Locator, testInfo: TestInfo) =>
  form.getByRole('button', {
    name: isDesktop(testInfo) ? 'Criar conta' : 'Criar perfil',
    exact: true,
  })

test.describe('Login', () => {
  test('vazio', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    // O modal foca o e-mail ao abrir: tira o foco para a captura "vazia".
    await blurActive(page)
    await capture(page, testInfo, 'login-vazio')
  })

  test('foco no campo de senha', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    await password(scope(page, testInfo)).focus()
    await capture(page, testInfo, 'login-foco-senha')
  })

  test('erros de validação', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    await loginButton(scope(page, testInfo)).click()
    await expect(page.getByText('Informe sua senha.')).toBeVisible()
    await capture(page, testInfo, 'login-validacao')
  })

  test('credenciais incorretas', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await password(form).fill('senha-errada-1')
    await loginButton(form).click()
    await expect(form.getByText('E-mail ou senha incorretos')).toBeVisible()
    await capture(page, testInfo, 'login-credenciais')
  })

  test('bloqueio com contagem regressiva', async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') })
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await password(form).fill(`errada-${attempt}`)
      await loginButton(form).click({ force: true })
      if (attempt < 5) await expect(password(form)).toHaveValue('')
    }
    await expect(form.getByRole('timer')).toContainText('Tente novamente em')
    // Congela o relógio logo em seguida: a contagem não muda durante a captura.
    const now = await page.evaluate<number>('Date.now()')
    await page.clock.pauseAt(now + 500)
    await expect(form.getByRole('timer')).toContainText('30 segundos')
    await capture(page, testInfo, 'login-bloqueio')
  })
})

test.describe('Cadastro', () => {
  test('vazio (requisitos da senha pendentes)', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    await blurActive(page)
    await capture(page, testInfo, 'cadastro-vazio')
  })

  test('requisitos da senha cumpridos', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    await password(form).fill('Abcdefg1')
    await expect(form.getByRole('listitem').filter({ hasText: 'número' })).toContainText(
      ', cumprido',
    )
    await capture(page, testInfo, 'cadastro-requisitos-cumpridos')
  })

  test('erros de validação', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    await signupButton(form, testInfo).click()
    await expect(form.getByText('Confirme sua senha.')).toBeVisible()
    await capture(page, testInfo, 'cadastro-validacao')
  })

  test('e-mail já em uso (disponibilidade)', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await password(form).focus()
    await expect(form.getByText('Este e-mail já está cadastrado')).toBeVisible()
    await capture(page, testInfo, 'cadastro-email-em-uso')
  })

  test('conflito 409 no envio, com o link "Entrar com este e-mail"', async ({ page }, testInfo) => {
    await go(page, '/cadastro', 'email-taken')
    const form = scope(page, testInfo)
    await form.getByLabel('Nome de usuário').fill('visual_user')
    await form.getByLabel('E-mail').fill('visual@kurio.test')
    await password(form).fill('Abcdefg1')
    await form.getByLabel('Confirmar senha').fill('Abcdefg1')
    await signupButton(form, testInfo).click()
    await expect(form.getByRole('link', { name: 'Entrar com este e-mail' })).toBeVisible()
    await capture(page, testInfo, 'cadastro-conflito-409')
  })

  test('[m] 320x700', async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo), 'só no mobile')
    await page.setViewportSize({ width: 320, height: 700 })
    await go(page, '/cadastro')
    await blurActive(page)
    await capture(page, testInfo, 'cadastro-320')
  })
})

test('aviso de expiração aberto em "/"', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') })
  await go(page, '/')
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  await page.clock.fastForward(1800 * 1000 - 100_000)
  const banner = page.getByRole('alertdialog', { name: 'Sua sessão expira em breve' })
  await expect(banner).toBeVisible()
  await settle(page)
  await expect(banner).toHaveScreenshot('aviso-expiracao.png', SHOT)
})
