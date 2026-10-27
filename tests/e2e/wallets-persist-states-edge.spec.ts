import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { authState, ready, useHandler } from './helpers.ts'

type Credentials = { email: string; password: string }

async function signIn(page: Page, user: Credentials = users.primary) {
  await page.goto('/')
  await ready(page)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(user)})`)
  await expect.poll(async () => (await authState(page)).status).toBe('authenticated')
}

async function openWallets(page: Page, user: Credentials = users.primary, query = '') {
  await signIn(page, user)
  await page.goto('/perfil/carteiras' + query)
  await ready(page)
  await expect(page.getByRole('region', { name: 'Carteira principal' })).toBeVisible()
}

const primary = (page: Page) => page.getByRole('region', { name: 'Carteira principal' })
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })

test('1. dados persistem após refresh e novo login, isolamento entre contas e validação de redirect', async ({
  page,
}, testInfo) => {
  // 1a. Persistência após reload
  await openWallets(page, users.primary)
  const pSection = primary(page)
  await pSection.getByLabel('Apelido da carteira').fill('Principal Persistente')
  await pSection.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira principal salva').first()).toBeVisible()

  await page.reload()
  await ready(page)
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Principal Persistente')

  // 1b. Isolamento: outro usuário não visualiza a carteira persistida do usuário primário
  await page.evaluate(`window.__kurio.auth.signOut()`)
  await expect.poll(async () => (await authState(page)).status).toBe('anonymous')

  await signIn(page, users.other)
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(primary(page).getByRole('button', { name: 'Adicionar' })).toBeVisible()
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('')

  // 1c. Voltar para o usuário primário traz de volta a carteira dele
  await page.evaluate(`window.__kurio.auth.signOut()`)
  await signIn(page, users.primary)
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Principal Persistente')

  // 1d. Redirect inválido é ignorado e não renderiza "Voltar ao pagamento"
  await page.goto('/perfil/carteiras?redirect=/home')
  await ready(page)
  await expect(page.getByRole('link', { name: /Voltar ao pagamento/ })).toBeHidden()

  // 1e. Redirect válido renderiza o link e redireciona ao salvar
  await page.goto('/perfil/carteiras?redirect=/pagamento')
  await ready(page)
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByRole('link', { name: /Voltar ao pagamento/ })).toBeVisible()
  }
  await primary(page).getByLabel('Apelido da carteira').fill('Para Pagamento')
  await primary(page).getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page).toHaveURL(/\/pagamento/)
})

test('2. pré-preenchimento do perfil quando não há carteira e edição resiliente a atualizações', async ({
  page,
}) => {
  await openWallets(page, users.other)
  const section = primary(page)

  // Dados pré-carregados a partir do perfil
  await expect(section.getByLabel('Nome de exibição')).toHaveValue('Outro Kurio')
  await expect(section.getByLabel('E-mail')).toHaveValue('outro@kurio.test')
  await expect(section.getByLabel('Nome ENS')).toHaveValue('')
  await expect(section.getByLabel('Apelido da carteira')).toHaveValue('')
  await expect(section.getByLabel('Nome do perfil')).toHaveValue('')
  await expect(section.getByLabel('Endereço da carteira')).toHaveValue('')

  // Inicia edição no formulário
  await section.getByLabel('Nome do perfil').fill('Perfil Em Edição')

  // Notificação de evento ou re-render de perfil no cliente não reseta o formulário em andamento
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'))
  })
  await expect(section.getByLabel('Nome do perfil')).toHaveValue('Perfil Em Edição')
})

test('3. antes de descarregar, diálogos de descarte ao navegar, sessão expirada e rota protegida', async ({
  page,
}, testInfo) => {
  // 3a. Acesso deslogado redireciona para login com redirect e retorna após autenticar
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page).toHaveURL(/\/entrar\?redirect=.*perfil.*carteiras/)
  await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)

  // 3b. Alterações não salvas ativam beforeunload
  await primary(page).getByLabel('Apelido da carteira').fill('Modificado Sem Salvar')
  const beforeUnloadPrevented = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event.defaultPrevented || event.returnValue !== undefined
  })
  expect(beforeUnloadPrevented).toBe(true)

  // 3c. Diálogo ao navegar por link interno: continuar editando vs descartar
  const leaveLink =
    testInfo.project.name === 'desktop'
      ? page
          .getByRole('complementary', { name: 'Menu do perfil' })
          .getByRole('link', { name: 'Dados do perfil' })
      : page.getByRole('link', { name: 'Voltar' })

  await leaveLink.click()
  const discardDialog = dialogOf(page, 'Descartar alterações?')
  await expect(discardDialog).toBeVisible()
  await discardDialog.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(discardDialog).toBeHidden()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)

  // Descartar alterações navega para a outra página
  await leaveLink.click()
  await dialogOf(page, 'Descartar alterações?').getByRole('button', { name: 'Descartar' }).click()
  await expect(page).not.toHaveURL(/\/perfil\/carteiras$/)

  // 3d. Sessão expirada navega para login com redirect sem ficar travada pelo guard
  await page.goto('/perfil/carteiras')
  await ready(page)
  await primary(page).getByLabel('Apelido da carteira').fill('Antes de Expirar')
  await page.evaluate('window.__kurio.emitSessionExpired()')
  await expect(page).toHaveURL(/\/entrar\?redirect=.*perfil.*carteiras/)
})

test('4. server-error com retry, skeleton em carregamento lento, formulário vazio, resize e foco no h1', async ({
  page,
}, testInfo) => {
  await signIn(page)

  // 4a. Erro de servidor exibe ErrorState com botão Tentar novamente
  await page.evaluate(() => {
    localStorage.setItem('kurio:mock:scenarios', 'server-error:GET /wallets')
  })
  await page.goto('/perfil/carteiras')
  await ready(page)
  await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
  await expect(
    page.getByText(
      'Não foi possível carregar este conteúdo. Verifique sua conexão e tente novamente.',
    ),
  ).toBeVisible()

  // Limpa o cenário e clica em Tentar novamente
  await page.evaluate(() => {
    localStorage.removeItem('kurio:mock:scenarios')
  })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(primary(page)).toBeVisible()

  // 4b. Carregamento lento ao navegar renderiza o skeleton com status acessível
  // Desktop: menu lateral em /perfil/dados. Mobile: o menu do perfil é a própria /perfil.
  await page.goto(testInfo.project.name === 'desktop' ? '/perfil/dados' : '/perfil')
  await ready(page)
  await page.evaluate(() => {
    localStorage.setItem('kurio:mock:scenarios', 'slow')
  })
  const navCarteiras =
    testInfo.project.name === 'desktop'
      ? page
          .getByRole('complementary', { name: 'Menu do perfil' })
          .getByRole('link', { name: 'Carteiras' })
      : page.locator('#conteudo').getByRole('link', { name: 'Carteiras' })

  await navCarteiras.click()
  await expect(page.getByRole('status').filter({ hasText: /Carregando carteiras/ })).toBeVisible()
  await expect(primary(page)).toBeVisible({ timeout: 10_000 })
  await page.evaluate(() => {
    localStorage.removeItem('kurio:mock:scenarios')
  })

  // 4c. Cenário de carteiras vazias renderiza formulário vazio da principal
  await useHandler(
    page,
    `worker.use(http.get('/api/wallets', () => HttpResponse.json({ primary: null, secondary: null })))`,
  )
  await page.evaluate(
    `window.__kurio.queryClient.refetchQueries({ queryKey: window.__kurio.queryKeys.wallets })`,
  )
  await expect(primary(page).getByRole('button', { name: 'Adicionar' })).toBeVisible()
  await expect(primary(page).getByLabel('Endereço da carteira')).toHaveValue('')

  // 4d. [d] Redimensionar de mobile para desktop mantém o estado do formulário
  if (testInfo.project.name === 'desktop') {
    await page.setViewportSize({ width: 375, height: 667 })
    await primary(page).getByLabel('Apelido da carteira').fill('Redimensionamento')
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(primary(page).getByLabel('Apelido da carteira')).toHaveValue('Redimensionamento')
  }

  // 4e. Título do documento e foco no h1 ao navegar para carteiras
  await page.goto(testInfo.project.name === 'desktop' ? '/perfil/dados' : '/perfil')
  await ready(page)
  const navTarget =
    testInfo.project.name === 'desktop'
      ? page
          .getByRole('complementary', { name: 'Menu do perfil' })
          .getByRole('link', { name: 'Carteiras' })
      : page.locator('#conteudo').getByRole('link', { name: 'Carteiras' })

  await navTarget.click()
  await expect(page).toHaveURL(/\/perfil\/carteiras$/)
  await expect(page).toHaveTitle('Carteiras | Kurio')
  await expect(page.getByRole('heading', { level: 1, name: 'Carteiras' })).toBeFocused()
})
