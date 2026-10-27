import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { users } from './fixtures.ts'
import {
  announcements,
  authState,
  collectAnnouncements,
  OTHER_USER,
  ready,
  scenarios,
  seedOrder,
  signInAs,
} from './helpers.ts'

function authFormScope(page: Page, testInfo: TestInfo): Locator {
  return testInfo.project.name === 'desktop' ? page.getByRole('dialog') : page.getByRole('main')
}

test.describe('13-083: Confirmação — controle de acesso (403, 404, erros, sem login e troca de usuário)', () => {
  test('1. 403: pedido de outro usuário e cenário forbidden-order mostram mensagem de acesso negado, link para a Início e nenhum dado do pedido vaza', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.goto('/')
    await ready(page)
    await signInAs(page, 'primary')

    // 1a. Pedido pertencente a outro usuário
    const otherOrderId = await seedOrder(page, {
      status: 'confirmed',
      userId: OTHER_USER.id,
    })

    await page.goto(`/pedido/${otherOrderId}`)
    await ready(page)

    // Mensagens de acesso negado e link para a Início
    await expect(
      page.getByRole('heading', { level: 2, name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Este pedido pertence a outra conta.')).toBeVisible()

    const homeLink = page.getByRole('link', { name: 'Voltar para o início' })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', '/')

    // Nenhum dado do pedido vaza
    await expect(page.getByText('Emerald Ape')).toHaveCount(0)
    await expect(page.getByText('Violet Nomad')).toHaveCount(0)
    await expect(page.getByText('Ivory Baron')).toHaveCount(0)
    await expect(page.getByText('26.846')).toHaveCount(0)
    await expect(page.getByText('26.83')).toHaveCount(0)
    await expect(page.getByText('0.016')).toHaveCount(0)
    await expect(page.getByText('Detalhes da transação')).toHaveCount(0)
    await expect(page.getByText(/^0x[0-9a-fA-F]{64}$/)).toHaveCount(0)

    // 1b. Cenário forbidden-order no mock mesmo para pedido do próprio usuário
    const ownOrderId = await seedOrder(page, { status: 'confirmed' })
    await scenarios(page, 'forbidden-order')
    await page.goto(`/pedido/${ownOrderId}`)
    await ready(page)

    await expect(
      page.getByRole('heading', { level: 2, name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Este pedido pertence a outra conta.')).toBeVisible()
    await expect(homeLink).toBeVisible()

    await expect(page.getByText('Emerald Ape')).toHaveCount(0)
    await expect(page.getByText('26.846')).toHaveCount(0)
    await expect(page.getByText('Detalhes da transação')).toHaveCount(0)
  })

  test('2. 404 para id inexistente e tratamento de server-error e offline com ErrorState e recuperação no Tentar novamente', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.goto('/')
    await ready(page)
    await signInAs(page, 'primary')

    // 2a. Pedido inexistente (404)
    await page.goto('/pedido/ordem-inexistente-nao-encontrada')
    await ready(page)

    await expect(
      page.getByRole('heading', { level: 2, name: 'Pedido não encontrado' }),
    ).toBeVisible()
    await expect(
      page.getByText('O pedido que você procura não existe ou foi removido.'),
    ).toBeVisible()

    const homeLink = page.getByRole('link', { name: 'Voltar para o início' })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', '/')

    // 2b. server-error:GET /orders/:id -> ErrorState com "Tentar novamente"
    const validOrderId = await seedOrder(page, { status: 'confirmed' })
    await scenarios(page, 'server-error:GET /orders/:id')
    await page.goto(`/pedido/${validOrderId}`)
    await ready(page)

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    const retryBtn = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryBtn).toBeVisible()

    // Limpa o erro e tenta novamente -> pedido carrega
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await retryBtn.click()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // 2c. network-error:GET /orders/:id e offline -> ErrorState com "Tentar novamente"
    await scenarios(page, 'network-error:GET /orders/:id')
    await page.goto(`/pedido/${validOrderId}`)
    await ready(page)

    await expect(alert).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()
    const networkRetryBtn = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(networkRetryBtn).toBeVisible()

    // Com o cenário offline ativo após o carregamento inicial autenticado
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'offline')`)
    await networkRetryBtn.click()
    // Continua no ErrorState pois offline simula queda de rede geral
    await expect(alert).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Algo deu errado' })).toBeVisible()

    // Ao normalizar a conexão (sem cenários), recupera com sucesso
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await networkRetryBtn.click()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  })

  test('3. sem login redireciona para /entrar com redirect, session-expired redireciona com aviso e troca de usuário protege dados', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)

    // Cria pedido do usuário primary
    await page.goto('/')
    await ready(page)
    await signInAs(page, 'primary')
    const orderId = await seedOrder(page, { status: 'confirmed' })

    // 3a. Sem login -> redireciona para /entrar?redirect=/pedido/<id>
    await page.evaluate(`localStorage.removeItem('kurio:session')`)
    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=.*pedido.*${orderId}`))

    // Faz login pelo formulário e volta ao pedido
    const form = authFormScope(page, testInfo)
    await form.getByLabel('E-mail').fill(users.primary.email)
    await form.getByLabel('Senha', { exact: true }).fill(users.primary.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`/pedido/${orderId}$`))
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // 3b. session-expired na página -> redireciona e avisa
    await collectAnnouncements(page)
    await page.evaluate(`(async () => {
      const raw = localStorage.getItem('kurio:session')
      if (!raw) return
      const { token } = JSON.parse(raw)
      const { sessionsStore } = window.__kurioMock.stores
      const session = await sessionsStore.get(token)
      if (session) {
        await sessionsStore.put({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
      }
      try {
        await window.__kurio.http.get('/orders')
      } catch {}
    })()`)

    await expect(page).toHaveURL(new RegExp(`/entrar\\?redirect=.*pedido.*${orderId}`))
    await expect.poll(async () => announcements(page)).toContain('Sua sessão expirou.')

    // 3c. Troca de usuário não mostra o pedido do usuário anterior (clearPrivateSession)
    await page.evaluate(`window.__kurio.clearPrivateSession()`)
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.other)})`)
    await expect.poll(async () => (await authState(page)).status).toBe('authenticated')

    await page.goto(`/pedido/${orderId}`)
    await ready(page)

    await expect(
      page.getByRole('heading', { level: 2, name: 'Você não tem acesso a este pedido' }),
    ).toBeVisible()
    await expect(page.getByText('Emerald Ape')).toHaveCount(0)
    await expect(page.getByText('26.846')).toHaveCount(0)
  })
})
