import type { Page } from '@playwright/test'

export const USER = {
  id: 'user-teste',
  displayName: 'Teste Kurio',
  username: 'teste',
  email: 'teste@kurio.test',
}

export const OTHER_USER = {
  id: 'user-outro',
  displayName: 'Outro Kurio',
  username: 'outro',
  email: 'outro@kurio.test',
}

/**
 * Registra handlers do MSW ANTES do primeiro render do app. O app expõe `window.__kurioMock`
 * logo depois de iniciar o worker e antes de montar a árvore; o setter abaixo roda nesse instante.
 * `setup` é o corpo de uma função `(msw) => void`, onde `msw = { worker, http, HttpResponse }`.
 */
export async function bootWithHandlers(page: Page, setup: string, extra = '') {
  await page.addInitScript(`
    ${extra}
    window.__kurioBoot = [(m) => { const { worker, http, HttpResponse } = m.msw; ${setup} }]
    let value
    Object.defineProperty(window, '__kurioMock', {
      configurable: true,
      get: () => value,
      set: (v) => { value = v; for (const f of window.__kurioBoot) f(v) },
    })
  `)
}

export async function openApp(page: Page, scenarios?: string) {
  if (scenarios !== undefined) {
    await page.addInitScript(
      `localStorage.setItem('kurio:mock:scenarios', ${JSON.stringify(scenarios)})`,
    )
  }
  await page.goto('/')
  await ready(page)
}

export async function ready(page: Page) {
  await page.waitForFunction('Boolean(window.__kurioMock) && Boolean(window.__kurio)')
}

export async function authState(page: Page) {
  return JSON.parse(await page.evaluate<string>(`JSON.stringify(window.__kurio.auth.state)`)) as {
    status: 'loading' | 'authenticated' | 'anonymous'
    user: { id: string; email: string } | null
    expiresAt: string | null
    expiryWarning: boolean
  }
}

/** Registra um handler do MSW em tempo de execução (depois do boot). */
export function useHandler(page: Page, body: string) {
  return page.evaluate(
    `(() => { const { worker, http, HttpResponse } = window.__kurioMock.msw; ${body} })()`,
  )
}

/** Coleta todas as mensagens escritas nas regiões aria-live (polite e assertive). */
export async function collectAnnouncements(page: Page) {
  await page.evaluate(`(() => {
    window.__ann = []
    for (const sel of ['[role="status"]', '[role="alert"]']) {
      const region = document.querySelector(sel)
      new MutationObserver(() => { const t = region.textContent; if (t) window.__ann.push(t) })
        .observe(region, { childList: true, characterData: true, subtree: true })
    }
  })()`)
}

export function announcements(page: Page) {
  return page.evaluate<string[]>(`window.__ann`)
}
