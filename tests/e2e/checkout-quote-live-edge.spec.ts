/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  firstEditionId,
  only,
  openApp,
  ready,
  recordApi,
  seedFigmaCart,
  signInAs,
} from './helpers.ts'

async function openCheckout(page: Page, activeScenarios?: string) {
  await openApp(page, activeScenarios)
  await seedFigmaCart(page)
  await signInAs(page, 'primary')
  await page.goto('/pagamento')
  await ready(page)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

test.describe('Pagamento — expiração da cotação, tempo real nos itens e cupom (13-073)', () => {
  test('1. cotação vence e é refeita sozinha; erro da cotação exibe "Tentar novamente" e recupera os valores', async ({
    page,
  }) => {
    test.setTimeout(60_000)

    // 1a) Erro da cotação: server-error em POST /quote exibe "Tentar novamente"
    await openApp(page, 'server-error:POST /quote')
    await seedFigmaCart(page)
    await signInAs(page, 'primary')
    await page.goto('/pagamento')
    await ready(page)

    const retryBtn = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retryBtn).toBeVisible()

    // Ao limpar o cenário de erro e clicar em "Tentar novamente", a cotação carrega
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
    await retryBtn.click()

    await expect(page.locator('#conteudo').getByText('5.576 ETH').first()).toBeVisible()
    await expect(retryBtn).toHaveCount(0)

    // 1b) Expiração da cotação com page.clock
    await page.clock.install()
    const api = recordApi(page)
    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
    api.clear()

    // Avança além do TTL da cotação (120 s)
    await page.clock.fastForward(125_000)
    await expect.poll(() => api.calls('POST', '/quote').length).toBeGreaterThanOrEqual(1)
  })

  test('2. triggerPriceChange e triggerStockChange atualizam a coluna de itens e o total; cupom inválido, expirado e remoção', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    await openCheckout(page)
    const violetEdition = await firstEditionId(page, 'violet-nomad-314')

    // Valores iniciais: subtotal 5.56 ETH + rede 0.016 ETH = total 5.576 ETH
    await expect(page.locator('#conteudo').getByText('5.576 ETH').first()).toBeVisible()

    // 1) triggerPriceChange: altera o preço de Emerald Ape #042 de 1.19 para 1.30 ETH
    // (x 2 = 2.60 ETH, novo subtotal 5.78 ETH, novo total 5.796 ETH)
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerPriceChange('emerald-ape-042', 'emerald-ape-042-1-50', '1.30')
    })()`)

    await expect(page.locator('#conteudo').getByText('5.796 ETH').first()).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByText('2.60 ETH').first()).toBeVisible()
    }

    // 2) triggerStockChange: esgota Violet Nomad #314 (estoque 0)
    // Subtotal passa a excluir Violet Nomad (1.39 ETH): 2.60 + 1.79 = 4.39 ETH; total = 4.406 ETH
    await page.evaluate(`(async () => {
      await window.__kurioMock.triggerStockChange('violet-nomad-314', ${JSON.stringify(violetEdition)}, 0)
    })()`)

    await expect(page.locator('#conteudo').getByText('4.406 ETH').first()).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.getByText('Esgotado').first()).toBeVisible()
    }

    // 3) Cupom: testado no desktop onde o formulário de cupom está presente no Pagamento
    if (testInfo.project.name === 'desktop') {
      const expandCouponBtn = page.getByRole('button', {
        name: 'Tem um código promocional? Aplique aqui',
      })
      await expandCouponBtn.click()

      const couponInput = page.getByRole('textbox', { name: 'Código promocional' })
      const applyBtn = page.getByRole('button', { name: 'Aplicar' })

      // Cupom inválido
      await couponInput.fill('INVALIDO')
      await applyBtn.click()
      await expect(page.getByText('Código promocional inválido.')).toBeVisible()

      // Cupom expirado
      await couponInput.fill('EXPIRADO')
      await applyBtn.click()
      await expect(page.getByText('Este código promocional expirou.')).toBeVisible()

      // Cupom válido: KURIO10 (10% de desconto sobre 4.39 ETH = 0.439 ETH)
      await couponInput.fill('KURIO10')
      await applyBtn.click()
      await expect(page.locator('#conteudo').getByText('Cupom KURIO10 aplicado')).toBeVisible()

      // Remoção do cupom: ao remover, o campo volta a ficar disponível para nova digitação
      const removeCouponBtn = page.getByRole('button', { name: 'Remover cupom KURIO10' })
      await expect(removeCouponBtn).toBeVisible()
      await removeCouponBtn.click()
      await expect(page.locator('#conteudo').getByText('Cupom KURIO10 aplicado')).toHaveCount(0)
      await expect(couponInput).toBeVisible()
      await expect(applyBtn).toBeVisible()
    }
  })

  test('3. [d] campo "Rede" do formulário define a rede única para cotação e carteira', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    test.setTimeout(60_000)
    await openCheckout(page)

    // Rede padrão inicial: Ethereum (taxa 0.016 ETH, total 5.576 ETH)
    await expect(page.getByText('0.016 ETH').first()).toBeVisible()
    await expect(page.getByText('5.576 ETH').first()).toBeVisible()

    // Troca para Polygon: taxa cai para 0.002 ETH (total 5.562 ETH)
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Polygon' }).click()
    await expect(page.getByText('0.002 ETH').first()).toBeVisible()
    await expect(page.getByText('5.562 ETH').first()).toBeVisible()

    // Conecta MetaMask: conecta na rede Polygon configurada no campo
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()

    // Troca para Solana: taxa cai para 0.0005 ETH
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Solana' }).click()
    await expect(page.getByText('0.0005 ETH').first()).toBeVisible()
    await expect(page.getByText('5.5605 ETH').first()).toBeVisible()
  })

  test('3. [m] rede da carteira salva escolhida define a rede única para cotação e carteira', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    test.setTimeout(60_000)

    // Cadastra uma carteira secundária na rede Polygon
    await openApp(page)
    await seedFigmaCart(page)
    await signInAs(page, 'primary')

    await page.evaluate(`(async () => {
      await window.__kurio.http.put('/wallets/secondary', {
        displayName: 'Teste Sec',
        username: 'testesec',
        nickname: 'Carteira Secundária',
        profileName: 'Perfil Sec',
        network: 'polygon',
        address: '0x2222222222222222222222222222222222222222',
        provider: 'metamask',
        referralCode: 'SEC1',
        email: 'sec@kurio.test',
        ensName: 'sec.eth',
      })
      window.__kurio.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.wallets,
      })
    })()`)

    await page.goto('/pagamento')
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    // Carteira principal (Ethereum): total 5.576 ETH
    await expect(page.locator('#conteudo').getByText('5.576 ETH')).toBeVisible()

    // Seleciona Carteira Secundária (Polygon): cotação recalcula com taxa Polygon (total 5.562 ETH)
    const secRadio = page.getByRole('radio', { name: 'Carteira Secundária' })
    await secRadio.click()
    await expect(secRadio).toBeChecked()
    await expect(page.locator('#conteudo').getByText('5.562 ETH')).toBeVisible()

    // Conecta MetaMask na rede Polygon
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(/Conectada: 0x/)).toBeVisible()

    // Alterna de volta para a Carteira de teste (Ethereum):
    // Cotação recalcula com taxa Ethereum e status indica rede diferente
    const primRadio = page.getByRole('radio', { name: 'Carteira de teste' })
    await primRadio.click()
    await expect(primRadio).toBeChecked()
    await expect(page.locator('#conteudo').getByText('5.576 ETH')).toBeVisible()
    await expect(
      page.locator('#conteudo').getByText(/Rede diferente: sua carteira está na Polygon/),
    ).toBeVisible()
  })
})
