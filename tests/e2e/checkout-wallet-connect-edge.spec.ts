/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  only,
  openApp,
  ready,
  recordApi,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

const CONNECTED = 'Conectada: 0xA91F…E82C'
const NEW_ADDRESS = '0x1111111111111111111111111111111111111111'
const NEW_ADDRESS_SHORT = 'Conectada: 0x1111…1111'

declare global {
  interface Window {
    __testWalletEmitter?: {
      emitAccounts: (accounts: string[]) => void
      emitChain: (network: 'ethereum' | 'polygon' | 'solana') => void
    }
  }
}

async function openCheckout(page: Page, activeScenarios?: string) {
  await openApp(page, activeScenarios)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

async function connectMetaMask(page: Page) {
  await page.getByRole('radio', { name: 'MetaMask' }).click()
  await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()
}

test.describe('Pagamento — conexão da carteira simulada, erros e eventos (13-072)', () => {
  test('1. [d] trocar a rede refaz a cotação (Polygon, Solana, Ethereum); escolher provedor sem rede exibe aviso e não conecta', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    test.setTimeout(60_000)
    await openCheckout(page)

    // Rede padrão inicial: Ethereum (taxa 0.016 ETH).
    await expect(page.getByText('0.016 ETH').first()).toBeVisible()

    // 1) Troca para Polygon: taxa cai para 0.002 ETH.
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Polygon' }).click()
    await expect(page.getByText('0.002 ETH').first()).toBeVisible()

    // 2) Troca para Solana: taxa cai para 0.0005 ETH.
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Solana' }).click()
    await expect(page.getByText('0.0005 ETH').first()).toBeVisible()

    // 3) Retorna para Ethereum: taxa volta a 0.016 ETH.
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Ethereum' }).click()
    await expect(page.getByText('0.016 ETH').first()).toBeVisible()

    // 4) Escolher provedor sem rede: no modo manual com rede vazia, exibe aviso e não conecta.
    await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).click()
    await page.getByRole('radio', { name: 'Preencher outra carteira' }).click()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue('')

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(
      page.locator('#conteudo').getByText('Selecione uma rede antes de escolher a carteira.'),
    ).toBeVisible()
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()
  })

  test('2. wallet-rejected exibe recusa e tentar novamente; wallet-disconnect na tela e dentro da revisão bloqueia pagamento e preserva estado', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    // 1) Cenário wallet-rejected.
    await openCheckout(page, 'wallet-rejected')

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText('Conexão recusada na carteira')).toBeVisible()
    const retryButton = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryButton).toBeVisible()

    // Sem carteira conectada, nada é enviado e o envio bloqueia com alerta.
    const api = recordApi(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(
      page.locator('p[role="alert"]', { hasText: 'Conecte uma carteira para continuar.' }),
    ).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toHaveCount(0)
    expect(api.calls('POST', '/orders')).toHaveLength(0)

    // 2) Conexão bem-sucedida para testar wallet-disconnect.
    await page.evaluate(() => localStorage.setItem('kurio:mock:scenarios', ''))
    await retryButton.click()
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

    // Disconnect na tela principal.
    await page.evaluate(`(() => window.__kurio?.wallet.disconnect())()`)
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()

    // Reconecta e abre a revisão.
    await page.getByRole('button', { name: 'Conectar' }).click()
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()
    await expect(review.getByRole('button', { name: 'Confirmar e pagar' })).toBeEnabled()

    // Disconnect DENTRO da revisão.
    await page.evaluate(`(() => window.__kurio?.wallet.disconnect())()`)

    // A revisão continua aberta, bloqueia pagamento e exibe pedido de reconexão.
    await expect(review).toBeVisible()
    await expect(review.getByRole('button', { name: 'Confirmar e pagar' })).toBeDisabled()
    await expect(review.getByText('Carteira desconectada. Conecte novamente.')).toBeVisible()
    const reconnectButton = review.getByRole('button', { name: 'Conectar carteira' })
    await expect(reconnectButton).toBeVisible()

    // Reconectar na revisão restaura o botão "Confirmar e pagar" com dados preservados.
    await reconnectButton.click()
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()
    await expect(review.getByRole('button', { name: 'Confirmar e pagar' })).toBeEnabled()
    await expect(review.getByText('Carteira desconectada. Conecte novamente.')).toHaveCount(0)
  })

  test('3. wallet-wrong-network oferece troca de rede; desconectar manual e troca de provedor já conectado', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    // 1) Cenário wallet-wrong-network: carteira conecta em rede diferente da exigida.
    await openCheckout(page, 'wallet-wrong-network')

    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(
      page.getByText(
        /^Rede diferente: sua carteira está na (Polygon|Solana)\. Selecione a Ethereum\.$/,
      ),
    ).toBeVisible()

    const switchButton = page.getByRole('button', { name: 'Trocar para Ethereum' })
    await expect(switchButton).toBeVisible()

    await switchButton.click()
    await expect(switchButton).toHaveCount(0)
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()

    // 2) Troca de provedor já conectado: remove o erro de wrong-network e conecta Coinbase Wallet.
    await page.evaluate(() => localStorage.setItem('kurio:mock:scenarios', ''))
    await page.getByRole('radio', { name: 'Coinbase Wallet' }).click()
    await expect(page.getByRole('radio', { name: 'Coinbase Wallet' })).toBeChecked()
    await expect(page.locator('#conteudo').getByText(/^Conectada: 0x/)).toBeVisible()

    // 3) Desconectar manual.
    const disconnectButton = page.getByRole('button', { name: 'Desconectar' })
    await expect(disconnectButton).toBeVisible()
    await disconnectButton.click()
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()
  })

  test('4. eventos accountsChanged e chainChanged atualizam o estado e anunciam em aria-live', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await openApp(page)
    await seedFigmaCart(page)
    await signInAs(page, 'primary')

    // Registra interceptador do provedor de carteira para emitir eventos de teste antes do checkout montar.
    await page.evaluate(`(() => {
      const current = window.__kurio?.walletRegistry.getWalletProvider()
      if (!current) return

      const accountListeners = new Set()
      const chainListeners = new Set()

      const originalOn = current.on.bind(current)
      current.on = (event, handler) => {
        if (event === 'accountsChanged') {
          accountListeners.add(handler)
        } else if (event === 'chainChanged') {
          chainListeners.add(handler)
        }
        const unsub = originalOn(event, handler)
        return () => {
          if (event === 'accountsChanged') {
            accountListeners.delete(handler)
          } else if (event === 'chainChanged') {
            chainListeners.delete(handler)
          }
          unsub()
        }
      }

      window.__testWalletEmitter = {
        emitAccounts(accounts) {
          for (const fn of accountListeners) fn(accounts)
        },
        emitChain(network) {
          for (const fn of chainListeners) fn(network)
        },
      }
    })()`)

    // Navega pelo router client-side para preservar os interceptadores na mesma instância window.
    await page.evaluate(`(() => {
      window.__kurio?.router.navigate({ to: '/pagamento' })
    })()`)
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    await collectAnnouncements(page)
    await connectMetaMask(page)

    // 1) accountsChanged com novo endereço atualiza o endereço da conexão e o texto na tela.
    await page.evaluate((address: string) => {
      window.__testWalletEmitter?.emitAccounts([address])
    }, NEW_ADDRESS)

    await expect(page.locator('#conteudo').getByText(NEW_ADDRESS_SHORT)).toBeVisible()

    // 2) chainChanged atualiza a rede e anuncia no aria-live.
    await page.evaluate(() => {
      window.__testWalletEmitter?.emitChain('polygon')
    })

    await expect
      .poll(async () => (await announcements(page)).includes('Rede alterada para Polygon'))
      .toBe(true)

    // 3) accountsChanged com lista vazia desconecta a carteira e anuncia no aria-live.
    await page.evaluate(() => {
      window.__testWalletEmitter?.emitAccounts([])
    })

    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()
    await expect
      .poll(async () => (await announcements(page)).includes('Carteira desconectada'))
      .toBe(true)
  })
})
