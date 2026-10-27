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
    // A Início tem esqueletos com role="status": só as regiões do anunciador têm aria-live.
    for (const sel of ['[role="status"][aria-live="polite"]', '[role="alert"]']) {
      const region = document.querySelector(sel)
      new MutationObserver(() => { const t = region.textContent; if (t) window.__ann.push(t) })
        .observe(region, { childList: true, characterData: true, subtree: true })
    }
  })()`)
}

export function announcements(page: Page) {
  return page.evaluate<string[]>(`window.__ann`)
}

/** Id da primeira edição do NFT, lido do mock (útil para NFTs gerados, cujas edições variam). */
export function firstEditionId(page: Page, nftId: string) {
  return page.evaluate<string>(`(async () => {
    const res = await fetch('/api/nfts/${nftId}')
    const nft = await res.json()
    return nft.editions[0].id
  })()`)
}

/**
 * Monta o carrinho do visitante pelo próprio mock. Chamar depois de `page.goto('/')` e `ready`;
 * o app só precisa recarregar a rota para ler o carrinho.
 */
export async function seedCart(
  page: Page,
  items: { nftId: string; editionId: string; quantity: number }[],
) {
  await page.evaluate(`(async () => {
    let id = localStorage.getItem('kurio:guest-cart-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('kurio:guest-cart-id', id)
    }
    for (const item of ${JSON.stringify(items)}) {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cart-Id': id },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('seedCart falhou: ' + res.status + ' ' + (await res.text()))
    }
  })()`)
}

/** Itens do Figma: Emerald Ape ×2, Violet Nomad, Ivory Baron. */
export async function seedFigmaCart(page: Page) {
  const violet = await firstEditionId(page, 'violet-nomad-314')
  const ivory = await firstEditionId(page, 'ivory-baron-088')
  await seedCart(page, [
    { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 2 },
    { nftId: 'violet-nomad-314', editionId: violet, quantity: 1 },
    { nftId: 'ivory-baron-088', editionId: ivory, quantity: 1 },
  ])
}

export type SeedOrderInput = {
  status: 'pending' | 'confirmed' | 'declined'
  userId?: string
  createdAt?: string
  network?: 'ethereum' | 'polygon' | 'solana'
  declineReason?: string
}

/**
 * Grava direto no mock um pedido com o snapshot do recibo do Figma e devolve o id. Chamar logado
 * como `users.primary` (o colecionador sai da carteira principal) e depois de `ready`.
 * Pendente: defina `kurio:mock:scenarios` = `payment-slow` antes, senão ele confirma em 3 s.
 */
export function seedOrder(page: Page, input: SeedOrderInput) {
  const config = {
    userId: USER.id,
    network: 'ethereum',
    createdAt: input.status === 'confirmed' ? '2026-07-29T12:00:00.000Z' : new Date().toISOString(),
    declineReason: 'Pagamento recusado pela carteira simulada.',
    ...input,
  }
  return page.evaluate<string>(`(async () => {
    const config = ${JSON.stringify(config)}
    const { nftsStore, ordersStore } = window.__kurioMock.stores
    const lines = [
      { nftId: 'emerald-ape-042', quantity: 2, unitPrice: '1.19', lineTotal: '2.38' },
      { nftId: 'violet-nomad-314', quantity: 6, unitPrice: '1.39', lineTotal: '8.34' },
      { nftId: 'ivory-baron-088', quantity: 9, unitPrice: '1.79', lineTotal: '16.11' },
    ]
    const items = []
    for (const line of lines) {
      const nft = await nftsStore.get(line.nftId)
      const edition = nft.editions[0]
      items.push({
        nftId: nft.id,
        name: nft.name,
        tokenId: nft.tokenId,
        image: { src: nft.image.src, alt: nft.image.alt },
        editionId: edition.id,
        editionLabel: edition.label,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })
    }

    const wallet = (await window.__kurio.http.get('/wallets')).data.primary
    const { id: walletId, slot, ...collector } = wallet

    const explorers = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      solana: 'https://solscan.io/tx/',
    }
    const txHash = '0xA91F' + '0'.repeat(56) + 'E82C'
    const id = crypto.randomUUID()
    const record = {
      id,
      userId: config.userId,
      status: config.status,
      createdAt: config.createdAt,
      quoteId: 'seed-quote-' + id,
      network: config.network,
      wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
      collector,
      items,
      subtotal: '26.83',
      discount: '0.00',
      networkFee: '0.016',
      total: '26.846',
    }
    if (config.status === 'confirmed') {
      record.txHash = txHash
      record.explorerUrl = explorers[config.network] + txHash
    }
    if (config.status === 'declined') record.declineReason = config.declineReason
    await ordersStore.put(record)
    return id
  })()`)
}
