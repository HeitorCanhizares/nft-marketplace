/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import { only, openApp, ready, recordApi, seedFigmaCart, signInAs, USER } from './helpers.ts'

const CONNECTED = 'Conectada: 0xA91F…E82C'
const OTHER_HEX_ADDRESS = '0x1111111111111111111111111111111111111111'
const SECONDARY_HEX_ADDRESS = '0x2222222222222222222222222222222222222222'

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

test.describe('Pagamento — formulário, rascunho, "Usar outra carteira?" e carteiras salvas mobile (13-071)', () => {
  test('1. [d] validação de todos os campos (limites do 13-060), vazio só acusa no envio, foco no primeiro erro; observação com mais de 500 caracteres', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    test.setTimeout(60_000)

    await openCheckout(page)

    // Modo manual com campos em branco para disparar erros de campo obrigatório vazio no envio.
    await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).click()
    await page.getByRole('radio', { name: 'Preencher outra carteira' }).click()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue('')

    // Vazio só acusa no envio: nenhum erro antes de tentar confirmar.
    await expect(page.getByText('Informe um nome de exibição.')).toHaveCount(0)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // Validações obrigatórias exibidas no envio.
    await expect(page.getByText('Informe um nome de exibição.')).toBeVisible()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()
    await expect(page.getByText('Selecione uma rede.')).toBeVisible()
    await expect(page.getByText('Informe o nome do perfil.')).toBeVisible()
    await expect(page.getByText('Endereço de carteira inválido.')).toBeVisible()
    await expect(page.getByText('Selecione uma carteira.')).toBeVisible()
    await expect(page.getByText('Informe o código de indicação.')).toBeVisible()
    await expect(page.getByText('Informe um e-mail.')).toBeVisible()
    await expect(page.getByText('Informe o nome ENS.')).toBeVisible()

    // Foco no primeiro erro (displayName).
    await expect(page.getByLabel('Nome de exibição')).toBeFocused()

    // Limites e formatos inválidos.
    await page.getByLabel('Nome de exibição').fill('a'.repeat(41))
    await page.getByLabel('Nome de usuário').fill('ab')
    await page.getByLabel('Nome do perfil').fill('b'.repeat(41))
    await page.getByLabel('Endereço da carteira').fill('0x1234')
    await page.getByLabel('ENS ou carteira secundária').fill('invalido_ens')
    await page.getByLabel('Código de indicação').fill('inv@lido')
    await page.getByRole('textbox', { name: /^E-mail \(obrigatório\)/ }).fill('email-invalido')
    await page.getByLabel('Nome ENS').fill('ENS-MAIUSCULO')

    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page.getByText('O nome de exibição deve ter até 40 caracteres.')).toBeVisible()
    await expect(
      page.getByText('O nome de usuário deve ter entre 3 e 20 caracteres.'),
    ).toBeVisible()
    await expect(page.getByText('O nome do perfil deve ter até 40 caracteres.')).toBeVisible()
    await expect(page.getByText('Endereço de carteira inválido.')).toBeVisible()
    await expect(page.getByText('Use um endereço 0x ou um nome .eth.')).toBeVisible()
    await expect(
      page.getByText('Use apenas letras, números, "_" e "-", sem espaços.'),
    ).toBeVisible()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(
      page.getByText('Use de 3 a 63 letras minúsculas, números ou hífens.'),
    ).toBeVisible()

    // Observação do colecionador com mais de 500 caracteres.
    const noteField = page.getByLabel('Observação do colecionador (opcional)')
    await noteField.evaluate((el) => el.removeAttribute('maxlength'))
    await noteField.fill('x'.repeat(501))

    await expect(page.getByText('A observação deve ter até 500 caracteres.').first()).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('dialog', { name: 'Revisar pedido' })).toHaveCount(0)
  })

  test('2. rascunho restaura valores, modo, observação, provedor e rede após reload; rascunho de outro usuário é descartado; modo secondary sem secundária volta a primary; usuário sem principal pré-preenchido pelo perfil', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)

    // 1) Rascunho restaura dados e rede após reload no desktop.
    await openCheckout(page)

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).click()
      await page.getByRole('radio', { name: 'Preencher outra carteira' }).click()

      await page.getByLabel('Nome de exibição').fill('Colecionador Rascunho')
      await page.getByRole('combobox', { name: /^Rede/ }).click()
      await page.getByRole('option', { name: 'Polygon' }).click()
      await page.getByLabel('Observação do colecionador (opcional)').fill('Nota salva')
      await page.getByRole('radio', { name: 'Coinbase Wallet' }).click()

      // Aguarda a gravação com debounce no sessionStorage.
      await expect
        .poll(async () => page.evaluate(() => sessionStorage.getItem('kurio:checkout-draft')))
        .not.toBeNull()

      await page.reload()
      await ready(page)
      await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
        'Nota salva',
      )
      await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador Rascunho')
      await expect(page.getByRole('radio', { name: 'Preencher outra carteira' })).toBeChecked()
      await expect(page.getByRole('combobox', { name: /^Rede/ })).toContainText('Polygon')
      await expect(page.getByRole('radio', { name: 'Coinbase Wallet' })).toBeChecked()
    }

    // 2) Rascunho de outro usuário é descartado.
    await page.evaluate(() => {
      const foreignDraft = {
        userId: 'user-outro',
        mode: 'manual',
        saveAsSecondary: false,
        note: 'Nota estrangeira',
        provider: 'coinbase',
        values: {
          displayName: 'Outro Usuário',
          profileName: 'Perfil Outro',
          network: 'ethereum',
          address: '0x1111111111111111111111111111111111111111',
          secondaryAddressOrEns: '',
          provider: 'coinbase',
          referralCode: 'OUTRO1',
          email: 'outro@kurio.test',
          ensLabel: 'outro',
          nickname: 'Carteira Outro',
          username: 'outro',
        },
      }
      sessionStorage.setItem('kurio:checkout-draft', JSON.stringify(foreignDraft))
    })

    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Nome de exibição')).not.toHaveValue('Outro Usuário')
      await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('')
    }

    const storedDraftRaw = await page.evaluate(() => sessionStorage.getItem('kurio:checkout-draft'))
    if (storedDraftRaw !== null) {
      expect(JSON.parse(storedDraftRaw)).toMatchObject({ userId: USER.id })
    }

    // 3) Modo secondary restaurado sem secundária cadastrada volta a primary.
    await page.evaluate((userId: string) => {
      const secondaryDraft = {
        userId,
        mode: 'secondary',
        saveAsSecondary: false,
        note: 'Nota de secundária',
        provider: null,
        values: {
          displayName: 'Teste',
          profileName: 'Perfil',
          network: 'ethereum',
          address: '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
          secondaryAddressOrEns: '',
          provider: 'metamask',
          referralCode: 'REF1',
          email: 'teste@kurio.test',
          ensLabel: 'teste',
          nickname: 'Sec',
          username: 'teste',
        },
      }
      sessionStorage.setItem('kurio:checkout-draft', JSON.stringify(secondaryDraft))
    }, USER.id)

    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByRole('checkbox', { name: 'Usar outra carteira?' })).not.toBeChecked()
    } else {
      await expect(page.getByRole('radio', { name: 'Carteira de teste' })).toBeChecked()
    }

    // 4) Usuário sem principal: formulário pré-preenchido pelo perfil.
    await page.evaluate(`(async (userId) => {
      sessionStorage.removeItem('kurio:checkout-draft')
      const existing = (await window.__kurioMock?.stores.walletsStore.getByUserId(userId)) ?? []
      for (const w of existing) {
        await window.__kurioMock?.stores.walletsStore.delete(w.id)
      }
      window.__kurio?.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.wallets,
      })
    })(${JSON.stringify(USER.id)})`)

    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await expect(page.getByLabel('Nome de exibição')).toHaveValue(USER.displayName)
      await expect(page.getByRole('textbox', { name: /^E-mail \(obrigatório\)/ })).toHaveValue(
        USER.email,
      )
      await expect(page.getByLabel('Nome de usuário')).toHaveValue(USER.username)
      await expect(page.getByLabel('Endereço da carteira')).toHaveValue('')
      await expect(page.getByLabel('Nome do perfil')).toHaveValue('')
    }
  })

  test('3. [d] "Usar outra carteira?": secundária com e sem secundária, preencher limpa, substituição e PUT /wallets/secondary antes do pedido', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'desktop')
    test.setTimeout(60_000)

    await openCheckout(page)

    // Checkbox vem desmarcado.
    const useOtherCheckbox = page.getByRole('checkbox', { name: 'Usar outra carteira?' })
    await expect(useOtherCheckbox).not.toBeChecked()

    // 1) Sem secundária cadastrada: só exibe "Preencher outra carteira".
    await useOtherCheckbox.click()
    await expect(page.getByRole('radio', { name: 'Carteira secundária' })).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Preencher outra carteira' })).toBeVisible()
    await expect(
      page.getByRole('checkbox', { name: 'Salvar como carteira secundária' }),
    ).toBeVisible()
    await expect(page.getByText('A carteira secundária atual será substituída.')).toHaveCount(0)

    // 2) Com secundária cadastrada via endpoint PUT /wallets/secondary.
    await page.evaluate(`(async () => {
      await window.__kurio?.http.put('/wallets/secondary', {
        displayName: 'Secundária Teste',
        username: 'secteste',
        nickname: 'Carteira Secundária Antiga',
        profileName: 'Perfil Sec',
        network: 'ethereum',
        address: '0x2222222222222222222222222222222222222222',
        provider: 'metamask',
        referralCode: 'SEC123',
        email: 'sec@kurio.test',
        ensName: 'sec.eth',
      })
      sessionStorage.removeItem('kurio:checkout-draft')
      window.__kurio?.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.wallets,
      })
    })()`)

    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    const useOtherWithSecondary = page.getByRole('checkbox', { name: 'Usar outra carteira?' })
    if (!(await useOtherWithSecondary.isChecked())) {
      await useOtherWithSecondary.click()
    }
    await expect(page.getByRole('radio', { name: 'Carteira secundária' })).toBeVisible()

    // "Carteira secundária" preenche os dados da secundária; "Preencher outra carteira" limpa.
    await page.getByRole('radio', { name: 'Carteira secundária' }).click()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(SECONDARY_HEX_ADDRESS)

    await page.getByRole('radio', { name: 'Preencher outra carteira' }).click()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue('')

    // Texto "Substituir a carteira secundária" com aviso quando já existe.
    const replaceCheckbox = page.getByRole('checkbox', {
      name: 'Substituir a carteira secundária',
    })
    await expect(replaceCheckbox).toBeVisible()
    await expect(replaceCheckbox).not.toBeChecked()
    await expect(page.getByText('A carteira secundária atual será substituída.')).toBeVisible()

    // 3) Preenchimento de nova secundária com apelido vazio (deve virar "Carteira secundária").
    await page.getByLabel('Nome de exibição').fill('Nova Secundária')
    await page.getByLabel('Nome de usuário').fill('novasec')
    await page.getByRole('combobox', { name: /^Rede/ }).click()
    await page.getByRole('option', { name: 'Ethereum' }).click()
    await page.getByLabel('Nome do perfil').fill('Perfil Novo')
    await page.getByLabel('Endereço da carteira').fill(OTHER_HEX_ADDRESS)
    await page.getByLabel('Tipo de carteira').click()
    await page.getByRole('option', { name: 'MetaMask' }).click()
    await page.getByLabel('Código de indicação').fill('NOVA1')
    await page.getByRole('textbox', { name: /^E-mail \(obrigatório\)/ }).fill('nova@kurio.test')
    await page.getByLabel('Nome ENS').fill('novasec')
    await replaceCheckbox.click()

    await connectMetaMask(page)

    // Falha em PUT /wallets/secondary impede o pedido.
    await page.evaluate(() => {
      localStorage.setItem('kurio:mock:scenarios', 'server-error:PUT /wallets/secondary')
    })
    const api = recordApi(page)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revisar pedido' })
    await expect(review).toBeVisible()

    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(
      review.getByText('Não foi possível salvar a carteira secundária. O pedido não foi enviado.'),
    ).toBeVisible()
    expect(api.calls('POST', '/orders')).toHaveLength(0)

    // Sucesso: remove o erro forçado e confirma de novo.
    await page.evaluate(() => {
      localStorage.setItem('kurio:mock:scenarios', '')
    })
    api.clear()
    await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
    await expect(page).toHaveURL(/\/pedido\/[^/]+$/)

    const putCalls = api.calls('PUT', '/wallets/secondary')
    expect(putCalls).toHaveLength(1)
    expect(putCalls[0].body).toMatchObject({
      nickname: 'Carteira secundária',
      address: OTHER_HEX_ADDRESS,
    })

    const orderCalls = api.calls('POST', '/orders')
    expect(orderCalls).toHaveLength(1)
  })

  test('4. [m] carteiras salvas mobile: sem carteira, troca entre carteiras, trocar carteira desconecta, editar carteira e teclado', async ({
    page,
  }, testInfo) => {
    only(testInfo, 'mobile')
    test.setTimeout(60_000)

    // 1) Sem nenhuma carteira: estado vazio, link de cadastro e botão desabilitado.
    await openApp(page)
    await seedFigmaCart(page)
    await signInAs(page, 'primary')

    await page.evaluate(`(async (userId) => {
      const existing = (await window.__kurioMock?.stores.walletsStore.getByUserId(userId)) ?? []
      for (const w of existing) {
        await window.__kurioMock?.stores.walletsStore.delete(w.id)
      }
      window.__kurio?.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.wallets,
      })
    })(${JSON.stringify(USER.id)})`)

    await page.goto('/pagamento')
    await ready(page)

    await expect(
      page.getByRole('heading', { name: 'Cadastre uma carteira para continuar' }),
    ).toBeVisible()
    const addWalletLink = page.getByRole('link', { name: 'Adicionar carteira' })
    await expect(addWalletLink).toBeVisible()
    expect(await addWalletLink.getAttribute('href')).toContain('/perfil/carteiras')
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()

    // 2) Cadastra principal e secundária para testar alternância e opções.
    await page.evaluate(`(async () => {
      await window.__kurio?.http.put('/wallets/primary', {
        displayName: 'Teste Kurio',
        username: 'teste',
        nickname: 'Carteira Principal',
        profileName: 'Perfil Principal',
        network: 'ethereum',
        address: '0xA91F3D7B9C1E0A5F48B2C6D09E17A3F5B8C4E82C',
        provider: 'metamask',
        referralCode: 'PRIM1',
        email: 'teste@kurio.test',
        ensName: 'teste.eth',
      })
      await window.__kurio?.http.put('/wallets/secondary', {
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
      window.__kurio?.queryClient.invalidateQueries({
        queryKey: window.__kurio.queryKeys.wallets,
      })
    })()`)

    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()

    // Troca entre principal e secundária.
    const secRadio = page.getByRole('radio', { name: 'Carteira Secundária' })
    const primRadio = page.getByRole('radio', { name: 'Carteira Principal' })
    await expect(secRadio).toBeVisible()
    await expect(primRadio).toBeVisible()

    await secRadio.click()
    await expect(secRadio).toBeChecked()

    await primRadio.click()
    await expect(primRadio).toBeChecked()

    // "Trocar carteira" desconecta e limpa o provedor.
    await page.getByRole('radio', { name: 'MetaMask' }).click()
    await expect(page.locator('#conteudo').getByText(CONNECTED)).toBeVisible()
    const changeWalletBtn = page.getByRole('button', { name: 'Trocar carteira' })
    await expect(changeWalletBtn).toBeVisible()
    await changeWalletBtn.click()
    await expect(page.locator('#conteudo').getByText('Não conectada')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'MetaMask' })).not.toBeChecked()

    // Menu "⋮" → "Editar carteira" e a volta preserva o rascunho.
    const menuTrigger = page.getByRole('button', {
      name: 'Opções da carteira Carteira Principal',
    })
    await menuTrigger.click()
    const editItem = page.getByRole('menuitem', { name: 'Editar carteira' })
    await expect(editItem).toBeVisible()
    await editItem.click()
    await expect(page).toHaveURL(/\/perfil\/carteiras\?redirect=(%2F|\/)pagamento$/)

    await page.goBack()
    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(primRadio).toBeChecked()

    // Teclado no menu: Enter abre e seleciona "Editar carteira".
    const optionsButton = page.getByRole('button', {
      name: 'Opções da carteira Carteira Principal',
    })
    await optionsButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: 'Editar carteira' })).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/perfil\/carteiras\?redirect=(%2F|\/)pagamento$/)
  })
})
