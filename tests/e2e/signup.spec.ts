import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, collectAnnouncements, announcements, ready, useHandler } from './helpers.ts'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function go(page: Page, path: string, scenarios?: string) {
  if (scenarios !== undefined) {
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`,
    )
  }
  await page.goto(path)
  await ready(page)
}

// No desktop o formulário vive no modal; no mobile, no conteúdo principal. O rodapé (com a
// newsletter, que também tem "E-mail") fica fora dos dois.
function scope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

function submitButton(form: Locator, testInfo: TestInfo) {
  const name = testInfo.project.name === 'desktop' ? 'Criar conta' : 'Criar perfil'
  return form.getByRole('button', { name, exact: true })
}

const fields = (form: Locator) => ({
  username: form.getByLabel('Nome de usuário'),
  email: form.getByLabel('E-mail'),
  password: form.getByLabel('Senha', { exact: true }),
  confirm: form.getByLabel('Confirmar senha'),
})

type Account = { username: string; email: string; password: string }

// Dados gerados por teste: nada de conta ou senha fixa fora do fixtures.
function newAccount(): Account {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return {
    username: `u${suffix}`.slice(0, 20),
    email: `u${suffix}@kurio.test`,
    password: `Aa1${Math.random().toString(36).slice(2, 12)}`,
  }
}

async function fillAccount(form: Locator, account: Account, confirm = account.password) {
  const f = fields(form)
  await f.username.fill(account.username)
  await f.email.fill(account.email)
  await f.password.fill(account.password)
  await f.confirm.fill(confirm)
}

async function setScenarios(page: Page, value: string) {
  await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(value)})`)
}

function requestsTo(page: Page, path: string) {
  const seen: { body: unknown }[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith(path)) {
      seen.push({ body: request.postDataJSON() as unknown })
    }
  })
  return seen
}

async function usersWithEmail(page: Page, email: string) {
  return page.evaluate<number>(
    `(async () => (await window.__kurioMock.stores.usersStore.getAll()).filter((u) => u.email === ${JSON.stringify(email)}).length)()`,
  )
}

async function describedBy(field: Locator) {
  const id = await field.getAttribute('aria-describedby')
  expect(id).not.toBeNull()
  return id ?? ''
}

test.describe('Estrutura', () => {
  test('1. [d] modal "Criar conta", abas, campos rotulados e foco inicial', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/cadastro?redirect=/carrinho')

    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    const nav = dialog.getByRole('navigation', { name: 'Entrar ou criar conta' })
    await expect(nav.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(
      dialog.getByText('Crie seu perfil de colecionador e conecte uma carteira quando quiser.'),
    ).toBeVisible()

    const f = fields(dialog)
    for (const field of Object.values(f)) await expect(field).toBeVisible()
    await expect(f.username).toBeFocused()

    // Com o usuário preenchido (válido), a troca de aba funciona e mantém o redirect.
    await f.username.fill('valido')
    await nav.getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho$/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
  })

  // O modal é ancorado pelo topo: o erro do usuário vazio cresce para baixo e a aba não se move.
  test('1. [d] clicar em "Entrar" com o usuário vazio e focado troca de aba', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/cadastro')
    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await expect(fields(dialog).username).toBeFocused()

    await dialog.getByRole('navigation').getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/entrar$/)
  })

  test('1. [m] página com h1, botão "Criar perfil" e link "Entre" com redirect', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page, '/cadastro?redirect=/carrinho')

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Criar perfil de colecionador' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Criar perfil', exact: true })).toBeVisible()
    await expect(page.getByText('Já tem uma conta? Entre')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entre', exact: true })).toHaveAttribute(
      'href',
      '/entrar?redirect=%2Fcarrinho',
    )
  })
})

test.describe('Validação', () => {
  test('2. nome de usuário: tamanho, espaço e acento são erros; "Heito_1.x" é válido', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const f = fields(scope(page, testInfo))

    for (const invalid of ['ab', 'a'.repeat(21), 'com espaço', 'açúcar']) {
      await f.username.fill(invalid)
      await f.email.focus()
      await expect(f.username).toHaveAttribute('aria-invalid', 'true')
      const message = page.locator(`[id="${await describedBy(f.username)}"]`)
      await expect(message).toBeVisible()
    }

    await f.username.fill('Heito_1.x')
    await expect(f.username).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('2. e-mail e senha: formatos inválidos são erros; senha com acento é válida', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const f = fields(scope(page, testInfo))

    await f.email.fill('isso-nao-e-email')
    await f.password.focus()
    await expect(f.email).toHaveAttribute('aria-invalid', 'true')
    await f.email.fill('valido@kurio.test')
    await expect(f.email).not.toHaveAttribute('aria-invalid', 'true')

    for (const invalid of ['semnumero', '12345678', 'curta1']) {
      await f.password.fill(invalid)
      await f.confirm.focus()
      await expect(f.password).toHaveAttribute('aria-invalid', 'true')
    }

    await f.password.fill('Açaí1234')
    await expect(f.password).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('2. confirmação diferente: "As senhas não coincidem.", mesmo com outro campo inválido', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)
    const seen = requestsTo(page, '/api/auth/register')

    await f.username.fill('ab')
    await f.email.fill('isso-nao-e-email')
    await f.password.fill('Abcdefg1')
    await f.confirm.fill('Diferente1')
    await submitButton(form, testInfo).click()

    await expect(form.getByText('As senhas não coincidem.')).toBeVisible()
    await expect(f.confirm).toHaveAttribute('aria-invalid', 'true')
    await expect(f.username).toHaveAttribute('aria-invalid', 'true')
    await expect(f.email).toHaveAttribute('aria-invalid', 'true')
    // O foco vai para o primeiro campo com erro, e cada erro está ligado ao campo.
    await expect(f.username).toBeFocused()
    for (const field of [f.username, f.email, f.confirm]) {
      await expect(page.locator(`[id="${await describedBy(field)}"]`)).toBeVisible()
    }
    expect(seen).toEqual([])
  })

  test('2. envio vazio mostra os erros e foca o primeiro campo', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)

    // Enter no botão focado: com o usuário vazio e focado, o clique com o mouse perde o botão porque o
    // erro do usuário (ao sair do campo) empurra o botão para baixo entre o mousedown e o mouseup.
    await submitButton(form, testInfo).focus()
    await page.keyboard.press('Enter')

    await expect(f.username).toBeFocused()
    for (const field of Object.values(f)) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
    }
  })
})

test.describe('Requisitos da senha', () => {
  test('3. pendente vira cumprido ao digitar, faz parte da descrição e nada é anunciado por tecla', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)
    // No desktop o foco inicial está no usuário: ir para a senha faz o erro dele aparecer, e isso
    // não faz parte do que se observa aqui (a digitação da senha).
    await f.password.focus()
    await collectAnnouncements(page)
    // Também vigia qualquer região de alerta/status criada durante a digitação.
    await page.evaluate(`(() => {
      window.__live = []
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches('[role="alert"], [role="status"], [aria-live]')) {
              window.__live.push(node.textContent)
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true })
    })()`)

    const rule = (label: string) => form.getByRole('listitem').filter({ hasText: label })

    await expect(rule('8+ caracteres')).toContainText(', pendente')
    await expect(rule('letra')).toContainText(', pendente')
    await expect(rule('número')).toContainText(', pendente')
    await expect(f.password).toHaveAccessibleDescription(/8\+ caracteres\s*, pendente/)

    await f.password.pressSequentially('abc')
    await expect(rule('letra')).toContainText(', cumprido')
    await expect(rule('8+ caracteres')).toContainText(', pendente')
    await expect(rule('número')).toContainText(', pendente')

    await f.password.pressSequentially('4')
    await expect(rule('número')).toContainText(', cumprido')

    await f.password.pressSequentially('5678')
    await expect(rule('8+ caracteres')).toContainText(', cumprido')
    await expect(f.password).toHaveAccessibleDescription(/letra\s*, cumprido/)

    expect(await announcements(page)).toEqual([])
    expect(await page.evaluate<string[]>('window.__live')).toEqual([])
  })
})

test.describe('Disponibilidade', () => {
  test('4. e-mail e usuário já existentes (qualquer caixa) mostram o conflito ao sair do campo', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const f = fields(scope(page, testInfo))
    const form = scope(page, testInfo)

    for (const email of [users.primary.email, users.primary.email.toUpperCase()]) {
      await f.email.fill(email)
      await f.password.focus()
      await expect(form.getByText('Este e-mail já está cadastrado')).toBeVisible()
    }

    for (const username of ['teste', 'TESTE']) {
      await f.username.fill(username)
      await f.email.focus()
      await expect(form.getByText('Este nome de usuário já está em uso')).toBeVisible()
    }

    // Valores livres não mostram erro.
    const free = newAccount()
    await f.email.fill(free.email)
    await f.password.focus()
    await expect(f.email).not.toHaveAttribute('aria-busy', 'true')
    await expect(form.getByText('Este e-mail já está cadastrado')).toHaveCount(0)
    await f.username.fill(free.username)
    await f.email.focus()
    await expect(f.username).not.toHaveAttribute('aria-busy', 'true')
    await expect(form.getByText('Este nome de usuário já está em uso')).toHaveCount(0)
    await expect(f.email).not.toHaveAttribute('aria-invalid', 'true')
    await expect(f.username).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('4. o indicador de verificação aparece durante a consulta lenta', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)
    await setScenarios(page, 'slow')

    await f.email.fill(newAccount().email)
    await f.password.focus()
    await expect(f.email).toHaveAttribute('aria-busy', 'true')
    await expect(f.email).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 })
  })

  test('4. a resposta atrasada de um valor antigo não aparece', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)
    const seen = requestsTo(page, '/api/auth/availability')

    // O valor antigo responde "em uso" só depois de 2 s; os demais, "livre" na hora.
    await useHandler(
      page,
      `worker.use(http.post('/api/auth/availability', async ({ request }) => {
        const body = await request.json()
        if (body.email === 'antigo@kurio.test') {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return HttpResponse.json({ available: false })
        }
        return HttpResponse.json({ available: true })
      }))`,
    )

    await f.email.fill('antigo@kurio.test')
    await f.password.focus()
    await expect.poll(() => seen.length).toBe(1)

    await f.email.fill('novo-valor@kurio.test')
    await f.password.focus()
    await expect.poll(() => seen.length).toBe(2)

    await page.waitForTimeout(2_600)
    await expect(form.getByText('Este e-mail já está cadastrado')).toHaveCount(0)
    await expect(f.email).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('4. falha na consulta não impede o envio', async ({ page }, testInfo) => {
    await go(page, '/cadastro', 'server-error:POST /auth/availability')
    const form = scope(page, testInfo)
    const account = newAccount()

    await fillAccount(form, account)
    await fields(form).confirm.focus()
    await submitButton(form, testInfo).click()

    await expect(page).toHaveURL('/')
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  })

  test('4. valores com formato inválido não geram requisição', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const f = fields(scope(page, testInfo))
    const seen = requestsTo(page, '/api/auth/availability')

    await f.username.fill('ab')
    await f.email.focus()
    await f.email.fill('nao-e-email')
    await f.password.focus()

    // Passa mais que o debounce da consulta antes de concluir que nada saiu.
    await page.waitForTimeout(800)
    expect(seen).toEqual([])
  })
})

test.describe('Sucesso', () => {
  test('5. cadastro válido entra na conta, avisa, não envia a confirmação e guarda só o hash', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const seen = requestsTo(page, '/api/auth/register')
    const account = newAccount()

    await fillAccount(form, account)
    await submitButton(form, testInfo).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText(`Conta criada. Bem-vindo(a), ${account.username}!`)).toBeVisible()
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    expect((await authState(page)).user?.email).toBe(account.email)

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('button', { name: `Menu de ${account.username}` })).toBeVisible()
    }

    expect(seen).toHaveLength(1)
    expect(Object.keys(seen[0].body as object).sort()).toEqual(['email', 'password', 'username'])

    const record = await page.evaluate<string>(
      `(async () => JSON.stringify(await window.__kurioMock.stores.usersStore.getByEmail(${JSON.stringify(account.email)})))()`,
    )
    const stored = JSON.parse(record) as Record<string, unknown>
    expect(typeof stored.passwordHash).toBe('string')
    expect(record).not.toContain(account.password)

    // Sai e volta a entrar com o mesmo e-mail e senha.
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: `Menu de ${account.username}` }).click()
      await page.getByRole('menuitem', { name: 'Sair' }).click()
    } else {
      await page.evaluate(`window.__kurio.auth.signOut()`)
    }
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')

    await page.evaluate(
      `window.__kurio.auth.signIn(${JSON.stringify({ email: account.email, password: account.password })})`,
    )
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
  })
})

test.describe('Conflitos e erros do servidor', () => {
  test('6. email-taken: erro no campo, foco nele e "Entrar com este e-mail" preenche o login sem expor o e-mail na URL', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro', 'email-taken')
    const form = scope(page, testInfo)
    const f = fields(form)
    const account = newAccount()

    await fillAccount(form, account)
    await submitButton(form, testInfo).click()

    await expect(form.getByText(/Este e-mail já está cadastrado/)).toBeVisible()
    await expect(f.email).toBeFocused()

    // O erro não some quando o foco sai do campo e volta (o clique no link acontece nesse meio).
    await f.password.focus()
    await expect(form.getByText(/Este e-mail já está cadastrado/)).toBeVisible()

    await form.getByRole('link', { name: 'Entrar com este e-mail' }).click()
    await expect(page).toHaveURL(/\/entrar/)
    expect(decodeURIComponent(page.url())).not.toContain(account.email)
    expect(page.url()).not.toContain('kurio.test')
    await expect(scope(page, testInfo).getByLabel('E-mail')).toHaveValue(account.email)
  })

  test('6. username-taken: erro e foco em "Nome de usuário"', async ({ page }, testInfo) => {
    await go(page, '/cadastro', 'username-taken')
    const form = scope(page, testInfo)

    await fillAccount(form, newAccount())
    await submitButton(form, testInfo).click()

    await expect(form.getByText(/Este nome de usuário já está em uso/)).toBeVisible()
    await expect(fields(form).username).toBeFocused()
  })

  test('6. conflito real: e-mail cadastrado depois da checagem', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const f = fields(form)
    const account = newAccount()

    await fillAccount(form, account)
    // A checagem de disponibilidade (ao sair do e-mail) responde "livre".
    await f.email.focus()
    await f.password.focus()
    await expect(f.email).not.toHaveAttribute('aria-busy', 'true')

    // Outro cadastro ocupa o e-mail no meio-tempo.
    await page.evaluate(`window.__kurioMock.stores.usersStore.put({
      id: 'user-plantado', username: 'plantado', email: ${JSON.stringify(account.email)},
      displayName: 'Plantado', passwordHash: 'x', passwordSalt: 'y',
    })`)

    await submitButton(form, testInfo).click()
    await expect(form.getByText(/Este e-mail já está cadastrado/)).toBeVisible()
    await expect(f.email).toBeFocused()
    await expect(page).toHaveURL(/\/cadastro/)
  })

  test('7. validation-error: "Revise os dados informados." e erro no campo da senha', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro', 'validation-error:POST /auth/register')
    const form = scope(page, testInfo)
    const account = newAccount()

    await fillAccount(form, account)
    await submitButton(form, testInfo).click()
    await expect(form.getByText('Revise os dados informados.')).toBeVisible()

    await setScenarios(page, '')
    await useHandler(
      page,
      `worker.use(http.post('/api/auth/register', () => HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Revise os dados informados.', details: {}, fields: { password: 'Senha recusada pelo servidor.' } } },
        { status: 422 },
      )))`,
    )
    await submitButton(form, testInfo).click()
    await expect(form.getByText('Senha recusada pelo servidor.')).toBeVisible()
    await expect(fields(form).password).toHaveAttribute('aria-invalid', 'true')
    await expect(fields(form).password).toBeFocused()

    // Digitar no campo limpa o erro do servidor.
    await fields(form).password.pressSequentially('x')
    await expect(form.getByText('Senha recusada pelo servidor.')).toHaveCount(0)
  })

  for (const kind of ['network-error', 'server-error']) {
    test(`8. ${kind}: mensagem, campos e senhas preservados, e "Tentar novamente" conclui`, async ({
      page,
    }, testInfo) => {
      await go(page, '/cadastro', `${kind}:POST /auth/register`)
      const form = scope(page, testInfo)
      const f = fields(form)
      const account = newAccount()

      await fillAccount(form, account)
      await submitButton(form, testInfo).click()

      await expect(form.getByText(/Não foi possível criar a conta agora/)).toBeVisible()
      await expect(f.username).toHaveValue(account.username)
      await expect(f.email).toHaveValue(account.email)
      await expect(f.password).toHaveValue(account.password)
      await expect(f.confirm).toHaveValue(account.password)

      await setScenarios(page, '')
      await form.getByRole('button', { name: 'Tentar novamente' }).click()
      await expect(page).toHaveURL('/')
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    })
  }

  test('9. duplo clique em "Criar conta" gera uma requisição e um usuário', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    const seen = requestsTo(page, '/api/auth/register')
    const account = newAccount()

    await fillAccount(form, account)
    await submitButton(form, testInfo).dblclick()

    await expect(page).toHaveURL('/')
    expect(seen).toHaveLength(1)
    expect(await usersWithEmail(page, account.email)).toBe(1)
  })
})

test.describe('Redirect', () => {
  test('10. redirect interno é respeitado', async ({ page }, testInfo) => {
    await go(page, '/cadastro?redirect=/carrinho')
    const form = scope(page, testInfo)

    await fillAccount(form, newAccount())
    await submitButton(form, testInfo).click()
    await expect(page).toHaveURL(/\/carrinho$/)
  })

  for (const bad of ['//evil.com', 'https://evil.com', '/cadastro']) {
    test(`10. redirect "${bad}" é descartado e o cadastro termina na Início`, async ({
      page,
    }, testInfo) => {
      await go(page, `/cadastro?redirect=${bad}`)
      const form = scope(page, testInfo)

      await fillAccount(form, newAccount())
      await submitButton(form, testInfo).click()
      await expect(page).toHaveURL('/')
    })
  }
})
