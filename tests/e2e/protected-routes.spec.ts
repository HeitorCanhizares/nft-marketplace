import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, bootWithHandlers, ready, USER } from './helpers.ts'

const FUTURE = '2099-01-01T00:00:00.000Z'

const PROTECTED = [
  '/pagamento',
  '/pedido/abc',
  '/perfil',
  '/perfil/dados',
  '/perfil/carteiras',
  '/?favoritos=1',
] as const

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

async function go(page: Page, path = '/') {
  await page.goto(path)
  await ready(page)
}

function scope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

async function signInBridge(page: Page) {
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function signInForm(page: Page, testInfo: TestInfo) {
  const form = scope(page, testInfo)
  await form.getByLabel('E-mail').fill(users.primary.email)
  await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}

// Navegação do roteador, sem recarregar: o histórico guarda a página anterior.
function routerNavigate(page: Page, href: string) {
  return page.evaluate(`window.__kurio.router.navigate({ href: ${JSON.stringify(href)} })`)
}

function currentRedirect(page: Page) {
  return new URL(page.url()).searchParams.get('redirect')
}

function pathAndSearch(page: Page) {
  const url = new URL(page.url())
  return `${url.pathname}${url.search}${url.hash}`
}

test.describe('Visitante em rota protegida', () => {
  for (const path of PROTECTED) {
    test(`1. "${path}" leva a /entrar?redirect=<origem> e o histórico não guarda o redirecionamento`, async ({
      page,
    }) => {
      await go(page)
      await routerNavigate(page, path)

      await expect(page).toHaveURL(/\/entrar\?redirect=/)
      expect(new URL(page.url()).pathname).toBe('/entrar')
      expect(currentRedirect(page)).toBe(path)

      // A página que redirecionou foi substituída: Voltar chega à Início, não à rota protegida.
      await page.goBack()
      await expect(page).toHaveURL(/^[^?#]*\/$/)
      expect(pathAndSearch(page)).toBe('/')
    })

    test(`2. entrar a partir do redirecionamento de "${path}" volta exatamente a ela`, async ({
      page,
    }, testInfo) => {
      await go(page, path)
      await expect(page).toHaveURL(/\/entrar\?redirect=/)
      expect(currentRedirect(page)).toBe(path)

      await signInForm(page, testInfo)

      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
      // No desktop, "/perfil" segue direto para os dados do perfil.
      const landing =
        path === '/perfil' && testInfo.project.name === 'desktop' ? '/perfil/dados' : path
      await expect.poll(() => pathAndSearch(page)).toBe(landing)
    })
  }

  test('2. a busca e o hash fazem parte do retorno ("/perfil/dados?x=1#a")', async ({
    page,
  }, testInfo) => {
    const path = '/perfil/dados?x=1#a'
    await go(page, path)
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    expect(currentRedirect(page)).toBe(path)

    await signInForm(page, testInfo)

    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await expect.poll(() => pathAndSearch(page)).toBe(path)
  })
})

test.describe('Rotas públicas', () => {
  for (const path of ['/', '/?q=a', '/carrinho', '/nft/x']) {
    test(`3. "${path}" abre sem login`, async ({ page }) => {
      await go(page, path)
      await expect(page.getByRole('main')).toBeVisible()
      expect(pathAndSearch(page)).toBe(path)
      expect((await authState(page)).status).toBe('anonymous')
    })
  }

  test('3. a página 404 abre sem login', async ({ page }) => {
    await go(page, '/nao-existe')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible()
    expect(pathAndSearch(page)).toBe('/nao-existe')
  })
})

test.describe('Barra inferior do mobile', () => {
  test('4. [m] deslogado, "Perfil" e "Favoritos" levam ao login com o redirect certo', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page)
    const bar = page.getByRole('navigation', { name: 'Navegação principal' })

    await bar.getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    expect(currentRedirect(page)).toBe('/perfil')

    await page.goBack()
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
    await bar.getByRole('link', { name: 'Favoritos' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    expect(currentRedirect(page)).toBe('/?favoritos=1')
  })

  test('4. [m] logado, "Perfil" e "Favoritos" abrem', async ({ page }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page)
    await signInBridge(page)
    const bar = page.getByRole('navigation', { name: 'Navegação principal' })

    await bar.getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/perfil/)
    expect(new URL(page.url()).pathname).not.toBe('/entrar')

    await bar.getByRole('link', { name: 'Favoritos' }).click()
    await expect.poll(() => pathAndSearch(page)).toBe('/?favoritos=1')
    await expect(bar.getByRole('link', { name: 'Favoritos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

test.describe('Recuperação da sessão', () => {
  // O GET /auth/session fica retido até `window.__release`; 'ok' devolve o usuário e '401' recusa.
  async function bootWithHeldSession(page: Page, outcome: 'ok' | '401') {
    await page.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tok', expiresAt: '${FUTURE}' }))`,
    )
    const answer =
      outcome === 'ok'
        ? `HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${FUTURE}' })`
        : `HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sessão inválida.', details: {} } }, { status: 401 })`
    await bootWithHandlers(
      page,
      `worker.use(http.get('/api/auth/session', async () => {
        await window.__gate
        return ${answer}
      }))`,
      `window.__gate = new Promise((resolve) => { window.__release = resolve })`,
    )
  }

  test('5. enquanto carrega a sessão não redireciona; depois da resposta abre a página', async ({
    page,
  }) => {
    await bootWithHeldSession(page, 'ok')
    await go(page, '/perfil/dados')

    await expect.poll(async () => (await authState(page)).status).toBe('loading')
    // Esqueleto de carregamento (aparece depois do atraso padrão de 1 s do roteador).
    await expect(page.getByText('Carregando…')).toBeVisible()
    expect(pathAndSearch(page)).toBe('/perfil/dados')

    await page.evaluate(`window.__release()`)
    await expect(page.getByRole('heading', { level: 1, name: 'Dados do perfil' })).toBeVisible()
    expect(pathAndSearch(page)).toBe('/perfil/dados')
  })

  test('5. resposta 401: vai para /entrar?redirect=%2Fperfil%2Fdados', async ({ page }) => {
    await bootWithHeldSession(page, '401')
    await go(page, '/perfil/dados')

    await expect.poll(async () => (await authState(page)).status).toBe('loading')
    expect(pathAndSearch(page)).toBe('/perfil/dados')

    await page.evaluate(`window.__release()`)
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fdados$/)
  })
})

test.describe('Rotas só para deslogado', () => {
  for (const [path, target] of [
    ['/entrar', '/'],
    ['/cadastro', '/'],
    ['/entrar?redirect=/carrinho', '/carrinho'],
    ['/cadastro?redirect=/carrinho', '/carrinho'],
  ] as const) {
    test(`6. logado, "${path}" leva a "${target}" sem mostrar o formulário`, async ({ page }) => {
      await go(page)
      await signInBridge(page)

      // Vigia qualquer campo de senha que apareça durante o carregamento (seletor CSS: observação
      // dentro da página, sem papel acessível equivalente para "existiu em algum instante").
      await page.addInitScript(`(() => {
        window.__sawForm = false
        const check = () => {
          if (document.querySelector('input[type="password"]')) window.__sawForm = true
        }
        new MutationObserver(check).observe(document, { childList: true, subtree: true })
      })()`)

      await page.goto(path)
      await ready(page)
      await expect.poll(() => pathAndSearch(page)).toBe(target)
      await expect(page.getByRole('main')).toBeVisible()
      expect(await page.evaluate<boolean>('window.__sawForm')).toBe(false)
      await expect(page.getByRole('dialog')).toHaveCount(0)
    })
  }
})

test.describe('Validação do redirect', () => {
  test('7. parseRedirect aceita só caminhos internos', async ({ page }) => {
    await go(page)

    // Os valores rejeitados são montados dentro da página: alguns não existem em JSON
    // (undefined) e outros são longos ou têm caractere de controle.
    const result = await page.evaluate<{ accepted: (string | undefined)[]; leaked: unknown[] }>(
      `(() => {
        const { parseRedirect } = window.__kurio.redirect
        const rejected = [
          '//evil.com', 'https://evil.com', '/\\\\evil.com', '/a\\\\b', 'javascript:alert(1)',
          '/entrar', '/cadastro?redirect=/x', '/a\\u0000b', '', '/' + 'a'.repeat(2999),
          undefined, null, 5, {}, ['/carrinho'],
        ]
        return {
          accepted: ['/carrinho', '/perfil/dados?x=1#a', '/?favoritos=1'].map((value) => parseRedirect(value)),
          leaked: rejected.map((value) => parseRedirect(value)).filter((value) => value !== undefined),
        }
      })()`,
    )

    expect(result.accepted).toEqual(['/carrinho', '/perfil/dados?x=1#a', '/?favoritos=1'])
    expect(result.leaked).toEqual([])
  })

  test('7. isProtectedPath e closeTarget seguem a tabela de rotas protegidas', async ({ page }) => {
    await go(page)

    const result = await page.evaluate<{
      protectedPaths: boolean[]
      publicPaths: boolean[]
      close: string[]
    }>(`(() => {
      const { isProtectedPath, closeTarget } = window.__kurio.redirect
      return {
        protectedPaths: ['/pagamento', '/pedido/abc', '/perfil', '/perfil/carteiras', '/?favoritos=1'].map(isProtectedPath),
        publicPaths: ['/', '/?q=a', '/carrinho', '/nft/x'].map(isProtectedPath),
        close: ['/pagamento', '/carrinho', undefined, '/perfil/dados', '/?favoritos=1'].map(closeTarget),
      }
    })()`)

    expect(result.protectedPaths).toEqual([true, true, true, true, true])
    expect(result.publicPaths).toEqual([false, false, false, false])
    expect(result.close).toEqual(['/', '/carrinho', '/', '/', '/'])
  })

  test('7. validateAuthSearch devolve sempre a chave "redirect"', async ({ page }) => {
    await go(page)

    const result = await page.evaluate<Record<string, unknown>>(`(() => {
      const { validateAuthSearch } = window.__kurio.redirect
      const bad = validateAuthSearch({ redirect: '//evil.com' })
      return {
        hasKey: 'redirect' in bad,
        badIsUndefined: bad.redirect === undefined,
        good: validateAuthSearch({ redirect: '/carrinho' }).redirect,
        missingHasKey: 'redirect' in validateAuthSearch({}),
      }
    })()`)

    expect(result).toEqual({
      hasKey: true,
      badIsUndefined: true,
      good: '/carrinho',
      missingHasKey: true,
    })
  })

  test('7. /entrar?redirect=//evil.com: a busca do roteador tem "redirect" indefinido', async ({
    page,
  }) => {
    await go(page, '/entrar?redirect=//evil.com')

    const search = await page.evaluate<{ value: string | null }>(`(() => {
      const search = window.__kurio.router.state.location.search
      return { value: search.redirect === undefined ? null : search.redirect }
    })()`)

    // O valor inválido não vaza para a busca (a chave sai da busca serializada ou fica undefined).
    expect(search).toEqual({ value: null })
  })
})

test.describe('Sair mantém o contexto', () => {
  test('8. [d] sair em /perfil/dados vai para a Início, não para o login', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await signInBridge(page)
    await routerNavigate(page, '/perfil/dados')
    await expect(page.getByRole('heading', { level: 1, name: 'Dados do perfil' })).toBeVisible()

    await page.getByRole('button', { name: 'Menu de Teste Kurio' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect.poll(() => pathAndSearch(page)).toBe('/')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
