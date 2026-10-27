// Script do LHCI (collect.puppeteerScript): entra como users.primary antes de auditar as páginas
// logadas. Usa a ponte de teste (`window.__kurio`, só no build de modo test) e o localStorage
// guarda o token. A credencial é lida de tests/e2e/fixtures.ts: o valor não é repetido aqui.
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const LOGGED_PATHS = ['/pagamento', '/perfil']

// No modo test o mock recria o banco (apagando as sessões) em toda aba nova, a menos que o
// sessionStorage da aba já tenha esta marca (src/lib/storage.ts: mockSeedResetDone). O Lighthouse
// audita numa aba nova, então marcamos cada aba nova antes do primeiro script da página.
const SEED_RESET_DONE_KEY = 'kurio:mock:seed-reset-done'
const guarded = new WeakSet()

function keepSessionInNewTabs(browser) {
  if (guarded.has(browser)) return
  guarded.add(browser)
  browser.on('targetcreated', async (target) => {
    if (target.type() !== 'page') return
    const tab = await target.page()
    if (!tab) return
    await tab.evaluateOnNewDocument((key) => {
      window.sessionStorage.setItem(key, '1')
    }, SEED_RESET_DONE_KEY)
  })
}

function primaryUser() {
  const source = readFileSync(join(__dirname, 'tests', 'e2e', 'fixtures.ts'), 'utf8')
  const block = /primary:\s*\{([^}]*)\}/.exec(source)
  const email = block && /email:\s*'([^']+)'/.exec(block[1])
  const password = block && /password:\s*'([^']+)'/.exec(block[1])
  if (!email || !password) throw new Error('users.primary não encontrado em tests/e2e/fixtures.ts')
  return { email: email[1], password: password[1] }
}

module.exports = async (browser, context) => {
  const { pathname, origin } = new URL(context.url)
  if (!LOGGED_PATHS.some((path) => pathname.startsWith(path))) return

  const user = primaryUser()
  keepSessionInNewTabs(browser)
  const page = await browser.newPage()
  try {
    await page.goto(origin + '/', { waitUntil: 'networkidle0' })
    await page.waitForFunction('Boolean(window.__kurio)')
    await page.evaluate((credentials) => window.__kurio.auth.signIn(credentials), user)
    await page.waitForFunction("window.__kurio.auth.state.status === 'authenticated'")
    if (pathname.startsWith('/pagamento')) {
      // O pagamento redireciona com o carrinho vazio: monta o do usuário (mesmo item do Figma).
      await page.evaluate(() =>
        window.__kurio.http.post('/cart/items', {
          nftId: 'emerald-ape-042',
          editionId: 'emerald-ape-042-1-50',
          quantity: 1,
        }),
      )
    }
  } finally {
    await page.close()
  }
}
