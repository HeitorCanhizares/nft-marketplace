// O código dentro de page.evaluate roda no navegador: precisa dos tipos do DOM.
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { authState, bootWithHandlers, ready, USER } from './helpers.ts'

const FUTURE = '2099-01-01T00:00:00.000Z'
const SIGNED_OUT = 'Você saiu da sua conta'

const SESSION_HANDLERS = `worker.use(
  http.get('/api/auth/session', () => HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${FUTURE}' })),
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
)`

// Sessão salva + handlers do MSW: o app sobe já autenticado (nenhuma API de auth existe ainda no mock).
async function bootLoggedIn(page: Page) {
  await page.addInitScript(
    `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tok', expiresAt: '${FUTURE}' }))`,
  )
  await bootWithHandlers(page, SESSION_HANDLERS)
}

async function go(page: Page, path = '/') {
  await page.goto(path)
  await ready(page)
}

async function goLoggedIn(page: Page, path: string) {
  await bootLoggedIn(page)
  await go(page, path)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

function only(testInfo: TestInfo, project: 'desktop' | 'mobile') {
  test.skip(testInfo.project.name !== project, `só no projeto ${project}`)
}

const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Navegação principal' })

async function seriousViolations(page: Page, disabledRules: string[] = []) {
  const { violations } = await new AxeBuilder({ page }).disableRules(disabledRules).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }))
}

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  if (result === null) throw new Error('Elemento sem caixa na tela.')
  return result
}

async function signedOutAnnouncements(page: Page) {
  return page.getByRole('status').filter({ hasText: SIGNED_OUT })
}

test.describe('Estrutura, item ativo e desabilitados (desktop)', () => {
  test('1. estrutura: banner, navegação, rodapé e link de pular', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)

    const nav = page.getByRole('banner').getByRole('navigation', { name: 'Navegação principal' })
    await expect(nav.getByRole('link', { name: 'Início', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Mercado', exact: true })).toBeVisible()
    for (const name of ['Criadores', 'Aprenda']) {
      await expect(nav.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('main')).toHaveCount(1)

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
  })

  test('2. item ativo do cabeçalho por rota', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    type Active = 'home' | 'market' | 'none'
    const publicCases: [string, Active][] = [
      ['/', 'home'],
      ['/carrinho', 'market'],
      ['/nft/x', 'market'],
    ]
    // Rotas protegidas: exigem sessão (05-037), então são abertas já logado.
    const protectedCases: [string, Active][] = [
      ['/pagamento', 'market'],
      ['/pedido/x', 'market'],
      ['/perfil/dados', 'none'],
      ['/perfil/carteiras', 'none'],
    ]

    async function expectActive(path: string, active: Active) {
      const nav = page.getByRole('banner').getByRole('navigation', { name: 'Navegação principal' })
      const home = nav.getByRole('link', { name: 'Início', exact: true })
      const market = nav.getByRole('link', { name: 'Mercado', exact: true })

      if (active === 'home') await expect(home, path).toHaveAttribute('aria-current', 'page')
      else await expect(home, path).not.toHaveAttribute('aria-current')

      if (active === 'market') await expect(market, path).toHaveAttribute('aria-current', 'page')
      else await expect(market, path).not.toHaveAttribute('aria-current')
    }

    for (const [path, active] of publicCases) {
      await go(page, path)
      await expectActive(path, active)
    }

    // O init script vale só para as navegações seguintes: as públicas acima seguem anônimas.
    await bootLoggedIn(page)
    for (const [path, active] of protectedCases) {
      await go(page, path)
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
      await expect(page, path).toHaveURL(new RegExp(`${path}$`))
      await expectActive(path, active)
    }
  })

  test('3. itens desabilitados mostram "Em breve" e não navegam', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)

    const creators = page.getByRole('button', { name: 'Criadores' })
    await page.keyboard.press('Tab')
    for (let i = 0; i < 12; i += 1) {
      if (await creators.evaluate((el) => el === document.activeElement)) break
      await page.keyboard.press('Tab')
    }
    await expect(creators).toBeFocused()
    await expect(page.getByRole('tooltip').first()).toContainText('Em breve')

    const url = page.url()
    // aria-disabled impede o clique "normal" do Playwright; o clique forçado prova que nada acontece.
    await creators.click({ force: true })
    expect(page.url()).toBe(url)
  })
})

test.describe('Busca e sessão no cabeçalho (desktop)', () => {
  test('4. busca: abre focada, Esc fecha, Enter navega, vazio não navega', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)

    const field = page.getByRole('textbox', { name: 'Buscar NFTs e coleções' })
    await page.getByRole('button', { name: 'Abrir busca' }).click()
    await expect(field).toBeFocused()
    await expect(mainNav(page)).toBeHidden()

    await page.keyboard.press('Escape')
    await expect(field).toBeHidden()
    await expect(page.getByRole('button', { name: 'Abrir busca' })).toBeFocused()
    await expect(mainNav(page)).toBeVisible()

    await page.getByRole('button', { name: 'Abrir busca' }).click()
    await page.keyboard.press('Enter')
    await expect(field).toBeVisible()
    expect(new URL(page.url()).search).toBe('')

    await page.keyboard.type('ape')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/\?q=ape#catalogo$/)
    await expect(field).toBeHidden()
    await expect(mainNav(page)).toBeVisible()
  })

  test('5. sessão no cabeçalho: anônimo, carregando e autenticado', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await expect(page.getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href',
      /^\/entrar\?redirect=/,
    )

    // Com sessão salva e a resposta do servidor retida, o estado fica `loading`.
    const fresh = await page.context().newPage()
    await fresh.addInitScript(
      `localStorage.setItem('kurio:session', JSON.stringify({ token: 'tok', expiresAt: '${FUTURE}' }))`,
    )
    await bootWithHandlers(
      fresh,
      `worker.use(http.get('/api/auth/session', async () => {
        await window.__gate
        return HttpResponse.json({ user: ${JSON.stringify(USER)}, expiresAt: '${FUTURE}' })
      }))`,
      `window.__gate = new Promise((resolve) => { window.__release = resolve })`,
    )
    await go(fresh)
    await expect.poll(async () => (await authState(fresh)).status).toBe('loading')
    await expect(fresh.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
    await expect(fresh.getByRole('button', { name: /^Menu de/ })).toHaveCount(0)

    await fresh.evaluate(`window.__release()`)
    await expect(fresh.getByRole('button', { name: `Menu de ${USER.displayName}` })).toBeVisible()
    await expect(fresh.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
  })

  test('6. UserMenu: teclado, navegação e saída', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await goLoggedIn(page, '/')

    const trigger = page.getByRole('button', { name: `Menu de ${USER.displayName}` })
    const profile = page.getByRole('menuitem', { name: 'Dados do perfil' })
    const wallets = page.getByRole('menuitem', { name: 'Carteiras' })
    const signOut = page.getByRole('menuitem', { name: 'Sair' })

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(profile).toBeVisible()
    await expect(wallets).toBeVisible()
    await expect(signOut).toBeVisible()

    await expect(profile).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(wallets).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(signOut).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(wallets).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await trigger.click()
    await profile.click()
    await expect(page).toHaveURL(/\/perfil\/dados$/)

    await trigger.click()
    await signOut.click()
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
    await expect(await signedOutAnnouncements(page)).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })
})

test.describe('Rodapé e perfil (desktop)', () => {
  test('7. rodapé: presença, newsletter, links e textos do Figma', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    const footer = page.getByRole('contentinfo')

    await go(page, '/carrinho')
    await expect(footer).toBeVisible()
    await go(page, '/perfil/dados')
    await expect(footer).toHaveCount(0)

    await go(page)
    await expect(footer).toBeVisible()

    // Newsletter desabilitada: campo sem edição e botão aria-disabled.
    await expect(
      footer.getByRole('textbox', { name: 'E-mail para a newsletter' }),
    ).not.toBeEditable()
    await expect(footer.getByRole('button', { name: 'Enviar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    // Textos principais do Figma.
    const texts = [
      'Segurança da carteira',
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
      'Criadores em destaque',
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
      'Alertas de lançamentos',
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
      'Antecipe-se ao próximo lançamento',
      'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.',
      'KURIO',
      'Feito para colecionadores, criadores e cultura',
      'contato@email.com',
      '+55 11 4002 8922',
      'Meu perfil',
      'Central de ajuda',
      'Coleções',
      'Redes sociais',
      'Carteiras compatíveis',
      '© 2026 Kurio. Propriedade digital para todos.',
    ]
    for (const text of texts) {
      await expect(footer, text).toContainText(text)
    }
    await expect(footer.getByRole('list', { name: 'Carteiras compatíveis' })).toContainText(
      'MetaMask',
    )

    // Links desabilitados não navegam.
    const url = page.url()
    await footer.getByRole('button', { name: 'Atividade' }).click({ force: true })
    const socials = footer.getByRole('list', { name: 'Redes sociais' }).getByRole('button')
    await expect(socials).toHaveCount(5)
    for (const social of await socials.all()) {
      await expect(social).toHaveAttribute('aria-disabled', 'true')
      await social.click({ force: true })
    }
    expect(page.url()).toBe(url)

    await footer.getByRole('link', { name: 'Arte digital' }).click()
    await expect(page).toHaveURL(/\/\?colecao=arte-digital$/)
  })

  for (const [path, label] of [
    ['/perfil/dados', 'Dados do perfil'],
    ['/perfil/carteiras', 'Carteiras'],
  ] as const) {
    test(`8. menu do perfil em ${path}`, async ({ page }, testInfo) => {
      only(testInfo, 'desktop')
      await goLoggedIn(page, path)

      const aside = page.getByRole('complementary', { name: 'Menu do perfil' })
      await expect(aside).toBeVisible()
      await expect(aside.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      )
      const disabled = aside.getByRole('button', { name: /\(em breve\)$/ })
      await expect(disabled).toHaveCount(5)
      for (const item of await disabled.all()) {
        await expect(item).toHaveAttribute('aria-disabled', 'true')
      }

      await aside.getByRole('button', { name: 'Sair', exact: true }).click()
      await expect(page).toHaveURL(/\/$/)
      await expect.poll(async () => (await authState(page)).status).toBe('anonymous')
      await expect(await signedOutAnnouncements(page)).toHaveCount(1)
    })
  }
})

test.describe('Estrutura mobile', () => {
  test('9. barra inferior, landmarks e abas', async ({ page }, testInfo) => {
    only(testInfo, 'mobile')
    await go(page)

    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)

    const nav = mainNav(page)
    await expect(nav).toHaveCount(1)
    await expect(nav.getByRole('listitem')).toHaveCount(5)
    await expect(nav.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    expect((await box(nav)).height).toBe(96)

    // O conteúdo reserva o espaço da barra.
    const reserved = await page
      .getByRole('main')
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom))
    expect(reserved).toBe(96)

    const home = nav.getByRole('link', { name: 'Início', exact: true })
    const favorites = nav.getByRole('link', { name: 'Favoritos' })
    await expect(home).toHaveAttribute('aria-current', 'page')

    // Deslogado, Favoritos e Perfil levam ao login e voltam ao destino depois (05-037 e 05-038).
    await favorites.click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2F%3Ffavoritos%3D1$/)
    await go(page)
    await nav.getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil$/)

    // Logado, as duas abas abrem normalmente.
    await bootLoggedIn(page)
    await go(page)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
    await favorites.click()
    await expect(page).toHaveURL(/\/\?favoritos=1$/)
    await expect(favorites).toHaveAttribute('aria-current', 'page')
    await expect(home).not.toHaveAttribute('aria-current')

    await nav.getByRole('link', { name: 'Carrinho' }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(mainNav(page)).toHaveCount(0)

    await go(page)
    await mainNav(page).getByRole('link', { name: 'Perfil' }).click()
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(mainNav(page)).toBeVisible()
    await expect(mainNav(page).getByRole('link', { name: 'Perfil' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

test.describe('404, foco e título', () => {
  test('10. página 404 dentro do AppShell', async ({ page }, testInfo) => {
    await go(page, '/rota-que-nao-existe')

    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
    } else {
      await expect(page.getByRole('banner')).toHaveCount(0)
    }

    await main.getByRole('link', { name: 'Voltar para o início' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(main.getByRole('heading', { name: 'Kurio', exact: true })).toBeVisible()
  })

  test('11. foco e título a cada troca de rota', async ({ page }) => {
    await go(page)
    const heading = (name: string) => page.getByRole('heading', { name, level: 1, exact: true })
    const activeTag = () => page.evaluate<string | undefined>(`document.activeElement?.tagName`)

    // Carga inicial: o foco não vai ao h1.
    expect(await activeTag()).not.toBe('H1')
    await expect(page).toHaveTitle('Kurio')

    await page.getByRole('link', { name: 'Carrinho', exact: true }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(heading('Carrinho de NFTs')).toBeFocused()
    await expect(page).toHaveTitle('Carrinho | Kurio')

    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(heading('Kurio')).toBeFocused()
    await expect(page).toHaveTitle('Kurio')

    // Trocar só a busca não move o foco. O controle (mudança de caminho) prova que o roteador
    // enxerga o pushState.
    const main = page.getByRole('main')
    await page.evaluate(`history.pushState({}, '', '/?q=a')`)
    await expect(page).toHaveURL(/\/\?q=a$/)
    await main.focus()
    await page.evaluate(`history.pushState({}, '', '/?q=b')`)
    await expect(page).toHaveURL(/\/\?q=b$/)
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 250)))
    await expect(main).toBeFocused()

    await page.evaluate(`history.pushState({}, '', '/carrinho')`)
    await expect(heading('Carrinho de NFTs')).toBeFocused()
  })
})

test.describe('Toaster', () => {
  const toastBox = (page: Page, text: string) =>
    page.getByRole('listitem').filter({ hasText: text }).first()

  test('12. posição do toast', async ({ page }, testInfo) => {
    await go(page)
    const viewport = page.viewportSize()
    if (viewport === null) throw new Error('Sem viewport.')

    const fire = async (text: string) => {
      await page.evaluate(`window.__kurio.toast(${JSON.stringify(text)}, { duration: 600000 })`)
      await expect(toastBox(page, text)).toBeVisible()
    }
    // Centro horizontal e distância até a borda de baixo; some em branco enquanto o toast anima.
    const placement = async (text: string) => {
      const rect = await toastBox(page, text).boundingBox()
      const size = page.viewportSize()
      if (rect === null || size === null) return null
      return { centerX: rect.x + rect.width / 2, bottomGap: size.height - (rect.y + rect.height) }
    }
    // O toast entra deslizando: a posição só vale depois de assentar, então o poll repete a medida.
    const settles = (text: string, check: (p: { centerX: number; bottomGap: number }) => boolean) =>
      expect
        .poll(async () => {
          const p = await placement(text)
          return p !== null && check(p)
        })
        .toBe(true)

    if (testInfo.project.name === 'desktop') {
      await fire('toast desktop')
      // Embaixo à direita, 24 px da borda de baixo.
      await settles(
        'toast desktop',
        (p) => p.centerX > viewport.width * 0.6 && p.bottomGap >= 20 && p.bottomGap <= 28,
      )

      await page.evaluate(`window.__kurio.toast.dismiss()`)
      await expect(toastBox(page, 'toast desktop')).toHaveCount(0)

      // Abaixo de 1024 px vira centralizado e sobe acima da barra inferior.
      await page.setViewportSize({ width: 1023, height: 900 })
      await fire('toast 1023')
      await settles(
        'toast 1023',
        (p) => Math.abs(p.centerX - 1023 / 2) <= 4 && p.bottomGap >= 96 && p.bottomGap <= 130,
      )
    } else {
      await fire('toast mobile')
      // Centralizado e acima da barra inferior (96 px) em "/".
      await settles(
        'toast mobile',
        (p) =>
          Math.abs(p.centerX - viewport.width / 2) <= 4 && p.bottomGap >= 96 && p.bottomGap <= 130,
      )
    }
  })
})

test.describe('Overflow horizontal', () => {
  for (const width of [320, 414, 1024, 1280, 1440]) {
    test(`13. sem rolagem horizontal em ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await bootLoggedIn(page)

      for (const path of ['/', '/carrinho', '/perfil/dados']) {
        await go(page, path)
        await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
        const widths = await page.evaluate<{ scroll: number; inner: number }>(
          `({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth })`,
        )
        expect(widths.scroll, `${path} em ${width}`).toBeLessThanOrEqual(widths.inner)
      }
    })
  }
})

test.describe('Acessibilidade automatizada', () => {
  for (const path of ['/', '/carrinho', '/perfil/dados', '/rota-que-nao-existe']) {
    test(`14. axe em ${path}`, async ({ page }) => {
      await bootLoggedIn(page)
      await go(page, path)
      await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      expect(await seriousViolations(page)).toEqual([])
    })
  }

  test('14. axe com o UserMenu aberto', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await goLoggedIn(page, '/')
    await page.getByRole('button', { name: `Menu de ${USER.displayName}` }).click()
    await expect(page.getByRole('menu')).toBeVisible()

    // O Radix marca o resto da página com aria-hidden enquanto o menu está aberto (comportamento esperado).
    expect(await seriousViolations(page, ['aria-hidden-focus'])).toEqual([])
  })

  test('14. axe com a busca aberta', async ({ page }, testInfo) => {
    only(testInfo, 'desktop')
    await go(page)
    await page.getByRole('button', { name: 'Abrir busca' }).click()
    await expect(page.getByRole('textbox', { name: 'Buscar NFTs e coleções' })).toBeFocused()
    // Espera o fim da transição de largura do campo.
    await expect
      .poll(
        async () =>
          (await box(page.getByRole('textbox', { name: 'Buscar NFTs e coleções' }))).width,
      )
      .toBeGreaterThan(250)

    expect(await seriousViolations(page)).toEqual([])
  })
})

test.describe('useMediaQuery', () => {
  test('15. 1023 → 1024 px troca a barra inferior pelo cabeçalho sem recarregar', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    await page.setViewportSize({ width: 1023, height: 900 })
    await go(page)
    await page.evaluate(`window.__noReload = true`)

    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(mainNav(page)).toHaveCount(1)
    await expect(mainNav(page).getByRole('listitem')).toHaveCount(5)

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(mainNav(page)).toHaveCount(1)
    await expect(mainNav(page).getByRole('listitem')).toHaveCount(4)

    await page.setViewportSize({ width: 1023, height: 900 })
    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(mainNav(page).getByRole('listitem')).toHaveCount(5)

    expect(await page.evaluate(`window.__noReload`)).toBe(true)
  })
})
