import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { announcements, authState, collectAnnouncements, ready } from './helpers.ts'

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

async function fill(form: Locator, email: string, password: string) {
  await form.getByLabel('E-mail').fill(email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
}

async function setScenarios(page: Page, value: string) {
  await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(value)})`)
}

function loginRequests(page: Page) {
  const seen: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/auth/login')) {
      seen.push(request.url())
    }
  })
  return seen
}

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  if (result === null) throw new Error('Elemento sem caixa na tela.')
  return result
}

test.describe('Estrutura', () => {
  test('1. [d] modal "Entrar" com a Início inerte, foco no e-mail e itens em breve', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/entrar')

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    // A Início ao fundo está inerte: só o título do modal é um h1 acessível.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: 'Kurio' })).toHaveCount(0)

    const nav = dialog.getByRole('navigation', { name: 'Entrar ou criar conta' })
    await expect(nav.getByRole('link', { name: 'Entrar' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Criar conta' })).not.toHaveAttribute(
      'aria-current',
      /.*/,
    )
    await expect(
      dialog.getByText('Entre para gerenciar sua carteira, coleção e perfil de criador.'),
    ).toBeVisible()

    // Tab nunca chega ao conteúdo de trás: a ordem fica toda dentro do modal.
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }

    const url = page.url()
    for (const name of ['Esqueceu a senha?', 'Continuar com Google', 'Continuar com Facebook']) {
      const item = dialog.getByRole('button', { name })
      await expect(item).toHaveAttribute('aria-disabled', 'true')
      await expect(item).not.toHaveAttribute('disabled', /.*/)
      // O Radix liga o balão ao gatilho (aria-describedby) só enquanto ele está aberto.
      await expect(async () => {
        await item.blur()
        await item.focus()
        await expect(item).toHaveAttribute('aria-describedby', /.+/, { timeout: 1_000 })
      }).toPass()
      const tipId = await item.getAttribute('aria-describedby')
      await expect(page.locator(`[id="${tipId}"]`)).toHaveText('Em breve')

      // aria-disabled: o Playwright trata como desabilitado, então o clique é forçado.
      await item.click({ force: true })
      expect(page.url()).toBe(url)
    }
  })

  test('2. [m] página com h1, logo, link de troca com redirect e sem barra inferior', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page, '/entrar?redirect=/carrinho')

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kurio, página inicial' })).toHaveAttribute(
      'href',
      '/',
    )
    await expect(page.getByText('Novo na Kurio? Crie uma conta')).toBeVisible()

    const swap = page.getByRole('link', { name: 'Crie uma conta' })
    await expect(swap).toHaveAttribute('href', '/cadastro?redirect=%2Fcarrinho')
    await swap.click()
    await expect(page).toHaveURL(/\/cadastro\?redirect=%2Fcarrinho$/)

    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0)
  })

  test('2b. [m] o link de troca usa a cor do texto, sem negrito e com sublinhado', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page, '/entrar')

    const swap = page.getByRole('link', { name: 'Crie uma conta' })
    const styles = await swap.evaluate((el) => {
      const own = getComputedStyle(el)
      const parent = getComputedStyle(el.parentElement ?? el)
      return {
        color: own.color,
        parentColor: parent.color,
        weight: own.fontWeight,
        parentWeight: parent.fontWeight,
        decoration: own.textDecorationLine,
      }
    })
    expect(styles.color).toBe(styles.parentColor)
    expect(styles.weight).toBe(styles.parentWeight)
    expect(styles.decoration).toBe('underline')
  })

  test('3. os rótulos existem para leitor de tela e não ocupam área visível', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)

    await expect(form.getByLabel('E-mail')).toBeVisible()
    await expect(form.getByLabel('Senha', { exact: true })).toBeVisible()

    for (const text of ['E-mail', 'Senha']) {
      const label = form.locator('label', { hasText: new RegExp(`^${text}`) })
      const area = await box(label)
      expect(area.width).toBeLessThanOrEqual(1)
      expect(area.height).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('Validação', () => {
  test('4. sair de campo vazio não mostra erro; só o envio mostra', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    const email = form.getByLabel('E-mail')
    const password = form.getByLabel('Senha', { exact: true })

    await email.focus()
    await password.focus()
    await email.focus()
    await expect(email).not.toHaveAttribute('aria-invalid', 'true')
    await expect(password).not.toHaveAttribute('aria-invalid', 'true')

    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(password).toHaveAttribute('aria-invalid', 'true')
  })

  test('4. envio vazio e e-mail inválido, sem nenhuma requisição', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const seen = loginRequests(page)
    const form = scope(page, testInfo)
    const email = form.getByLabel('E-mail')
    const password = form.getByLabel('Senha', { exact: true })

    // E-mail inválido: o erro aparece ao sair do campo, antes de qualquer envio.
    await email.fill('nao-e-um-email')
    await password.focus()
    await expect(form.getByText('Informe um e-mail válido.')).toBeVisible()
    await email.fill('')

    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    // E-mail vazio tem mensagem própria, diferente da de formato inválido.
    await expect(form.getByText('Informe um e-mail.')).toBeVisible()
    await expect(form.getByText('Informe sua senha.')).toBeVisible()
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(password).toHaveAttribute('aria-invalid', 'true')

    for (const [field, message] of [
      [email, 'Informe um e-mail.'],
      [password, 'Informe sua senha.'],
    ] as const) {
      const describedBy = await field.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(message)
    }

    expect(seen).toEqual([])
  })
})

test.describe('Sucesso e redirect', () => {
  test('5. login válido leva à Início, guarda a sessão e sobrevive ao recarregamento', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)

    await fill(form, users.primary.email, users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL('/')
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('button', { name: 'Menu de Teste Kurio' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
    }

    const stored = await page.evaluate(`localStorage.getItem('kurio:session')`)
    expect(stored).not.toBeNull()

    await page.reload()
    await ready(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    expect((await authState(page)).user?.email).toBe(users.primary.email)
    await expect(page).toHaveURL('/')
  })

  test('6. redirect interno é respeitado depois do login', async ({ page }, testInfo) => {
    await go(page, '/entrar?redirect=/carrinho')
    const form = scope(page, testInfo)
    await fill(form, users.primary.email, users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
  })

  for (const bad of ['//evil.com', 'https://evil.com', '/entrar']) {
    test(`6. redirect "${bad}" é descartado e o login vai para a Início`, async ({
      page,
    }, testInfo) => {
      await go(page, `/entrar?redirect=${bad}`)
      const form = scope(page, testInfo)
      await fill(form, users.primary.email, users.primary.password)
      await form.getByRole('button', { name: 'Entrar', exact: true }).click()
      await expect(page).toHaveURL('/')
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    })
  }
})

test.describe('Erros e bloqueio', () => {
  test('7. senha errada: alerta genérico, e-mail mantido, senha vazia e com foco', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    const submit = form.getByRole('button', { name: 'Entrar', exact: true })

    await fill(form, users.primary.email, 'senha-errada-1')
    await submit.click()

    const alert = form.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos' })
    await expect(alert).toBeVisible()
    await expect(alert).not.toContainText(/senha incorreta|e-mail incorreto/i)
    await expect(form.getByLabel('E-mail')).toHaveValue(users.primary.email)
    await expect(form.getByLabel('Senha', { exact: true })).toHaveValue('')
    await expect(form.getByLabel('Senha', { exact: true })).toBeFocused()
    await expect(submit).not.toHaveAttribute('aria-disabled', 'true')
    await expect(submit).not.toHaveAttribute('aria-busy', 'true')

    // O botão voltou a funcionar: a credencial certa entra.
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await submit.click()
    await expect(page).toHaveURL('/')
  })

  test('8. bloqueio de 30 s após 5 erros: contagem, anúncio único e retomada', async ({
    page,
  }, testInfo) => {
    await page.clock.install()
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    const submit = form.getByRole('button', { name: 'Entrar', exact: true })
    await collectAnnouncements(page)

    await form.getByLabel('E-mail').fill(users.primary.email)
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await form.getByLabel('Senha', { exact: true }).fill(`errada-${attempt}`)
      await submit.click()
      // A latência do mock usa timers: avança o relógio falso até a resposta chegar.
      await page.clock.runFor(5_000)
      if (attempt < 5) {
        await expect(form.getByText('E-mail ou senha incorretos')).toBeVisible()
      }
    }

    const timer = form.getByRole('timer')
    await expect(timer).toBeVisible()
    await expect(timer).toContainText(/Tente novamente em \d+ segundos?\./)
    await expect(submit).toHaveAttribute('aria-disabled', 'true')

    // A senha certa durante o bloqueio continua bloqueada: nenhuma requisição sai.
    const seen = loginRequests(page)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    // aria-disabled: o Playwright trata como desabilitado, então o clique é forçado.
    await submit.click({ force: true })
    await page.clock.runFor(2_000)
    expect(seen).toEqual([])
    await expect(page).toHaveURL(/\/entrar/)

    // O anúncio assertivo do bloqueio saiu uma vez só, não a cada segundo.
    const spoken = await announcements(page)
    expect(spoken.filter((text) => text.startsWith('Muitas tentativas'))).toHaveLength(1)

    await page.clock.fastForward(31_000)
    await expect(timer).toHaveCount(0)
    await expect(submit).not.toHaveAttribute('aria-disabled', 'true')
    expect(await announcements(page)).toContain('Você já pode tentar novamente.')

    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await submit.click()
    await page.clock.runFor(5_000)
    await expect(page).toHaveURL('/')
  })

  for (const kind of ['network-error', 'server-error']) {
    test(`9. ${kind}: mensagem, campos preservados e "Tentar novamente" conclui`, async ({
      page,
    }, testInfo) => {
      await go(page, '/entrar', `${kind}:POST /auth/login`)
      const form = scope(page, testInfo)

      await fill(form, users.primary.email, users.primary.password)
      await form.getByRole('button', { name: 'Entrar', exact: true }).click()

      await expect(form.getByText(/Não foi possível entrar agora/)).toBeVisible()
      await expect(form.getByLabel('E-mail')).toHaveValue(users.primary.email)
      await expect(form.getByLabel('Senha', { exact: true })).toHaveValue(users.primary.password)

      await setScenarios(page, '')
      await form.getByRole('button', { name: 'Tentar novamente' }).click()
      await expect(page).toHaveURL('/')
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    })
  }

  test('10. duplo clique em "Entrar" gera uma só requisição', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const seen = loginRequests(page)
    const form = scope(page, testInfo)

    await fill(form, users.primary.email, users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).dblclick()

    await expect(page).toHaveURL('/')
    expect(seen).toHaveLength(1)
  })
})

test.describe('Sessão ativa e fechamento', () => {
  test('11. já logado, /entrar leva à Início ou ao redirect', async ({ page }) => {
    await go(page, '/entrar')
    await page.evaluate(
      `window.__kurio.auth.signIn(${JSON.stringify({ email: users.primary.email, password: users.primary.password })})`,
    )
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

    await page.evaluate(`window.__kurio.router.navigate({ to: '/entrar' })`)
    await expect(page).toHaveURL('/')

    await page.evaluate(
      `window.__kurio.router.navigate({ to: '/entrar', search: { redirect: '/carrinho' } })`,
    )
    await expect(page).toHaveURL(/\/carrinho$/)
  })

  test('12. [d] Esc e X fecham o modal e devolvem o foco ao "Entrar"; origem protegida vai à Início', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/carrinho')

    const header = page.getByRole('banner')
    const trigger = header.getByRole('link', { name: 'Entrar' })

    // Abre por teclado: o foco só volta ao gatilho se ele estava focado.
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fcarrinho$/)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(trigger).toBeFocused()

    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Fechar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(trigger).toBeFocused()

    await page.evaluate(
      `window.__kurio.router.navigate({ to: '/entrar', search: { redirect: '/pagamento' } })`,
    )
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Campo de senha e teclado', () => {
  test('13. o olho alterna aria-pressed, rótulo, tipo e devolve o foco ao campo', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    const password = form.getByLabel('Senha', { exact: true })
    await password.fill('segredo123')

    const show = form.getByRole('button', { name: 'Mostrar senha' })
    await expect(show).toHaveAttribute('aria-pressed', 'false')
    await expect(password).toHaveAttribute('type', 'password')

    await show.click()
    const hide = form.getByRole('button', { name: 'Ocultar senha' })
    await expect(hide).toHaveAttribute('aria-pressed', 'true')
    await expect(password).toHaveAttribute('type', 'text')
    await expect(password).toBeFocused()

    await hide.click()
    await expect(form.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(password).toHaveAttribute('type', 'password')
    await expect(password).toBeFocused()
  })

  test('14. Enter na senha envia o formulário', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)

    await fill(form, users.primary.email, users.primary.password)
    await form.getByLabel('Senha', { exact: true }).press('Enter')
    await expect(page).toHaveURL('/')
  })

  test('14. [d] a ordem do Tab segue o DOM e não sai do modal', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/entrar')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    const expected = [
      'Senha',
      'Mostrar senha',
      'Esqueceu a senha? (em breve)',
      'Entrar',
      'Continuar com Google (em breve)',
      'Continuar com Facebook (em breve)',
      'Fechar',
    ]

    const visited: string[] = []
    for (let i = 0; i < expected.length; i += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      visited.push(
        await page.evaluate(() => {
          const el = document.activeElement
          const label = el instanceof HTMLInputElement ? el.labels?.[0]?.textContent : null
          return el?.getAttribute('aria-label') ?? label ?? el?.textContent?.trim() ?? ''
        }),
      )
    }
    expect(visited.map((text) => text.replace(/\s+/g, ' ').trim())).toEqual(expected)
  })
})
