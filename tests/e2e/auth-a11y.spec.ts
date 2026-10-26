// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready } from './helpers.ts'

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

async function go(page: Page, path: string) {
  await page.goto(path)
  await ready(page)
}

function scope(page: Page, testInfo: TestInfo): Locator {
  return isDesktop(testInfo) ? page.getByRole('dialog') : page.getByRole('main')
}

// aria-hidden-focus: falso positivo do hideOthers do Radix com o modal aberto (como no 04-033).
async function seriousViolations(page: Page, testInfo: TestInfo) {
  const disabled = isDesktop(testInfo) ? ['aria-hidden-focus'] : []
  const { violations } = await new AxeBuilder({ page }).disableRules(disabled).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

async function wrongPassword(form: Locator, password = 'senha-errada-1') {
  await form.getByLabel('E-mail').fill(users.primary.email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}

const submitName = (testInfo: TestInfo) => (isDesktop(testInfo) ? 'Criar conta' : 'Criar perfil')

test.describe('1. axe', () => {
  test('/entrar: base, com erros, com credenciais inválidas e com bloqueio', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    await expect(form.getByLabel('E-mail')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])

    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(form.getByText('Informe sua senha.')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])

    await wrongPassword(form)
    await expect(form.getByText('E-mail ou senha incorretos')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])

    for (let attempt = 2; attempt <= 5; attempt += 1) {
      await form.getByLabel('Senha', { exact: true }).fill(`senha-errada-${attempt}`)
      await form.getByRole('button', { name: 'Entrar', exact: true }).click({ force: true })
      if (attempt < 5) await expect(form.getByLabel('Senha', { exact: true })).toHaveValue('')
    }
    await expect(form.getByRole('timer')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])
  })

  test('/cadastro: base, com erros e com os requisitos da senha cumpridos', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    await expect(form.getByLabel('Nome de usuário')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])

    // Enter no botão focado: com o usuário vazio e focado, o clique com o mouse perde o botão porque o
    // erro do usuário (ao sair do campo) empurra o botão para baixo entre o mousedown e o mouseup.
    await form.getByRole('button', { name: submitName(testInfo), exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(form.getByText('Confirme sua senha.')).toBeVisible()
    expect(await seriousViolations(page, testInfo)).toEqual([])

    await form.getByLabel('Senha', { exact: true }).fill('Abcdefg1')
    await expect(form.getByRole('listitem').filter({ hasText: 'número' })).toContainText(
      ', cumprido',
    )
    expect(await seriousViolations(page, testInfo)).toEqual([])
  })

  test('aviso de expiração aberto (em página logada)', async ({ page }) => {
    await page.clock.install()
    await go(page, '/')
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await page.clock.fastForward(1800 * 1000 - 100_000)
    await expect(
      page.getByRole('alertdialog', { name: 'Sua sessão expira em breve' }),
    ).toBeVisible()
    // O aviso e o modal de login não coexistem (o login só abre sem sessão): varre a página com o aviso.
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  })
})

test.describe('2. Teclado do modal', () => {
  test('[d] Enter no "Entrar" do cabeçalho abre; o foco fica preso; Esc, X e Enter fecham e devolvem o foco', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page, '/')
    const trigger = page.getByRole('banner').getByRole('link', { name: 'Entrar' })

    // Tab no cabeçalho até o "Entrar".
    await page.keyboard.press('Tab')
    for (
      let i = 0;
      i < 20 && !(await trigger.evaluate((el) => el === document.activeElement));
      i += 1
    ) {
      await page.keyboard.press('Tab')
    }
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()

    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 14; i += 1) {
        await page.keyboard.press(key)
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
      }
    }

    // Depois de percorrer os botões "Em breve", o foco volta ao campo antes do Esc.
    await dialog.getByLabel('E-mail').focus()
    // Depois de uma rajada de Tab, o Radix ainda está fechando os balões "Em breve" e pode engolir
    // o primeiro Esc (só acontece com teclas em milissegundos); repete o Esc até o modal fechar.
    await expect(async () => {
      if ((await dialog.count()) > 0) await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0, { timeout: 500 })
    }).toPass({ timeout: 8_000 })
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Fechar' }).focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Fechar' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('3. Foco visível', () => {
  for (const path of ['/entrar', '/cadastro']) {
    test(`${path}: cada controle tem anel ou borda de foco`, async ({ page }, testInfo) => {
      await go(page, path)
      const form = scope(page, testInfo)
      const controls = await form.locator('input, button, a[href]').all()
      expect(controls.length).toBeGreaterThan(5)

      const missing: string[] = []
      for (const control of controls) {
        if (!(await control.isVisible())) continue
        await control.focus()
        // Só vale :focus-visible; o foco por script em campo de texto também o ativa.
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        const style = await control.evaluate((el) => {
          const s = getComputedStyle(el)
          return {
            focused: el === document.activeElement,
            outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
            shadow: s.boxShadow !== 'none',
            border: s.borderColor,
          }
        })
        if (style.focused && !style.outline && !style.shadow) {
          const name =
            (await control.getAttribute('aria-label')) ?? (await control.textContent()) ?? '?'
          missing.push(name.trim())
        }
      }
      expect(missing).toEqual([])
    })
  }
})

test.describe('4. Semântica', () => {
  test('/entrar: dialog/h1, autocomplete, required e botões de ícone nomeados', async ({
    page,
  }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)

    await expect(page.getByRole('main').or(page.getByRole('dialog'))).toBeVisible()
    if (isDesktop(testInfo)) {
      await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
    } else {
      await expect(page.getByRole('main')).toBeVisible()
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    await expect(form.getByLabel('E-mail')).toHaveAttribute('autocomplete', 'email')
    await expect(form.getByLabel('Senha', { exact: true })).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    for (const name of ['E-mail', 'Senha']) {
      const field = form.getByLabel(name, { exact: true })
      await expect(field).toHaveAttribute('required', '')
      await expect(field).toHaveAttribute('aria-required', 'true')
    }
    await expect(form.getByRole('button', { name: 'Mostrar senha' })).toBeVisible()
    if (isDesktop(testInfo))
      await expect(form.getByRole('button', { name: 'Fechar' })).toBeVisible()

    // Ícones decorativos (svg) não têm nome acessível.
    const namedIcons = await form.evaluate(
      (el) =>
        Array.from(el.querySelectorAll('svg')).filter(
          (svg) => svg.getAttribute('aria-label') || svg.querySelector('title'),
        ).length,
    )
    expect(namedIcons).toBe(0)
  })

  test('/cadastro: dialog/h1, autocomplete e required', async ({ page }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)

    if (isDesktop(testInfo)) {
      await expect(page.getByRole('dialog', { name: 'Criar conta' })).toBeVisible()
    } else {
      await expect(page.getByRole('main')).toBeVisible()
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    const expected: [Locator, string][] = [
      [form.getByLabel('Nome de usuário'), 'username'],
      [form.getByLabel('E-mail'), 'email'],
      [form.getByLabel('Senha', { exact: true }), 'new-password'],
      [form.getByLabel('Confirmar senha'), 'new-password'],
    ]
    for (const [field, autocomplete] of expected) {
      await expect(field).toHaveAttribute('autocomplete', autocomplete)
      await expect(field).toHaveAttribute('required', '')
      await expect(field).toHaveAttribute('aria-required', 'true')
    }
    await expect(form.getByRole('button', { name: 'Mostrar senha' })).toHaveCount(2)
  })
})

test.describe('5. Erros ligados aos campos', () => {
  test('/cadastro: cada campo com erro tem aria-invalid e a descrição traz a mensagem', async ({
    page,
  }, testInfo) => {
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    // Enter no botão focado: com o usuário vazio e focado, o clique com o mouse perde o botão porque o
    // erro do usuário (ao sair do campo) empurra o botão para baixo entre o mousedown e o mouseup.
    await form.getByRole('button', { name: submitName(testInfo), exact: true }).focus()
    await page.keyboard.press('Enter')

    for (const field of [
      form.getByLabel('Nome de usuário'),
      form.getByLabel('E-mail'),
      form.getByLabel('Senha', { exact: true }),
      form.getByLabel('Confirmar senha'),
    ]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      const id = await field.getAttribute('aria-describedby')
      expect(id).not.toBeNull()
      const message =
        (await page.locator(`[id="${(id ?? '').split(' ').pop()}"]`).textContent()) ?? ''
      expect(message.trim()).not.toBe('')
      await expect(field).toHaveAccessibleDescription(
        new RegExp(message.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      )
    }
  })

  test('/entrar: os dois campos vazios têm erro ligado', async ({ page }, testInfo) => {
    await go(page, '/entrar')
    const form = scope(page, testInfo)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(form.getByLabel('E-mail')).toHaveAccessibleDescription(/e-mail válido/)
    await expect(form.getByLabel('Senha', { exact: true })).toHaveAccessibleDescription(
      /Informe sua senha/,
    )
    await expect(form.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Senha', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
})

test.describe('6. Overflow horizontal', () => {
  for (const width of [320, 414, 1024, 1280, 1440]) {
    for (const path of ['/entrar', '/cadastro']) {
      test(`${path} em ${width} px, também com erros visíveis`, async ({ page }, testInfo) => {
        only(testInfo, 'desktop')
        await page.setViewportSize({ width, height: 900 })
        await go(page, path)

        const overflow = () =>
          page.evaluate<{ scroll: number; inner: number }>(
            `({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth })`,
          )
        let widths = await overflow()
        expect(widths.scroll).toBeLessThanOrEqual(widths.inner)

        const submit =
          path === '/entrar' ? 'Entrar' : width >= 1024 ? 'Criar conta' : 'Criar perfil'
        await page.getByRole('button', { name: submit, exact: true }).click()
        await expect(page.getByRole('alert').first()).toBeVisible()
        widths = await overflow()
        expect(widths.scroll).toBeLessThanOrEqual(widths.inner)
      })
    }
  }
})

test.describe('7. Altura baixa e zoom', () => {
  test('[d] 1440x500: o modal rola por dentro e o botão de enviar é alcançável', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await page.setViewportSize({ width: 1440, height: 500 })
    await go(page, '/cadastro')
    const dialog = page.getByRole('dialog')

    const metrics = await dialog.evaluate((el) => ({
      scrolls: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
      fits: el.getBoundingClientRect().height <= window.innerHeight,
    }))
    expect(metrics).toEqual({ scrolls: true, overflowY: 'auto', fits: true })

    const submit = dialog.getByRole('button', { name: 'Criar conta', exact: true })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
  })

  test('320x256 (zoom de 400%): há rolagem vertical e o conteúdo é alcançável', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await page.setViewportSize({ width: 320, height: 256 })
    await go(page, '/cadastro')

    const scrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight,
    )
    expect(scrollable).toBe(true)
    const widths = await page.evaluate<{ scroll: number; inner: number }>(
      `({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth })`,
    )
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner)

    const submit = page.getByRole('button', { name: 'Criar perfil', exact: true })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeInViewport()
  })
})

test.describe('8. Reduzir movimento', () => {
  test('com prefers-reduced-motion, o "verificando" e o modal funcionam', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await go(page, '/cadastro')
    const form = scope(page, testInfo)
    await expect(form.getByLabel('Nome de usuário')).toBeVisible()

    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'slow')`)
    const email = form.getByLabel('E-mail')
    await email.fill('livre-motion@kurio.test')
    await form.getByLabel('Senha', { exact: true }).focus()
    await expect(email).toHaveAttribute('aria-busy', 'true')
    await expect(email).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 })
    expect(await seriousViolations(page, testInfo)).toEqual([])
  })
})
