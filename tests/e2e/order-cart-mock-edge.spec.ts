import { expect, test, type Page } from '@playwright/test'

import { users } from './fixtures.ts'
import { ready, scenarios, seedOrder, signInAs, USER } from './helpers.ts'

async function setupSignedIn(page: Page) {
  await page.goto('/')
  await ready(page)
  await signInAs(page, 'primary')
}

test.describe('13-085: Confirmação — baixa seletiva do carrinho e mock concorrente', () => {
  test('1. baixa seletiva do carrinho: só itens e quantidades comprados saem, adicionados depois continuam, cupom mantido se sobra e removido se esvaziado; recusa e pendente não mexem', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await scenarios(page, 'payment-confirmed')
    await setupSignedIn(page)

    // Configura estoque abundante para não haver recusa por falta de estoque
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      for (const id of ['emerald-ape-042', 'violet-nomad-314', 'ivory-baron-088']) {
        const nft = await nftsStore.get(id)
        if (nft) {
          nft.editions = nft.editions.map((ed) => ({ ...ed, available: 100 }))
          await nftsStore.put(nft)
        }
      }
    })()`)

    // Monta carrinho do usuário com 3 linhas e cupom aplicado:
    // - Emerald Ape #042: qtd 3
    // - Violet Nomad #314: qtd 1
    // - Ivory Baron #088: qtd 1 (item adicionado depois da cotação)
    await page.evaluate(`(async () => {
      const { cartsStore, nftsStore } = window.__kurioMock.stores
      const userCartId = 'cart-' + ${JSON.stringify(USER.id)}

      const emerald = await nftsStore.get('emerald-ape-042')
      const violet = await nftsStore.get('violet-nomad-314')
      const ivory = await nftsStore.get('ivory-baron-088')

      const cartRecord = {
        id: userCartId,
        ownerId: ${JSON.stringify(USER.id)},
        items: [
          {
            id: 'item-emerald',
            nft: emerald,
            edition: { id: emerald.editions[0].id, label: emerald.editions[0].label },
            quantity: 3,
            unitPrice: '1.19',
            lineTotal: '3.57',
            availability: 'available',
            available: 100,
          },
          {
            id: 'item-violet',
            nft: violet,
            edition: { id: violet.editions[0].id, label: violet.editions[0].label },
            quantity: 1,
            unitPrice: '1.39',
            lineTotal: '1.39',
            availability: 'available',
            available: 100,
          },
          {
            id: 'item-ivory',
            nft: ivory,
            edition: { id: ivory.editions[0].id, label: ivory.editions[0].label },
            quantity: 1,
            unitPrice: '1.79',
            lineTotal: '1.79',
            availability: 'available',
            available: 100,
          },
        ],
        itemCount: 5,
        version: 1,
        coupon: { code: 'PROMO10' },
      }
      await cartsStore.put(cartRecord)
    })()`)

    // 1a. Pedido pendente não altera o carrinho nem o estoque
    await seedOrder(page, { status: 'pending' })
    const cartDuringPending = await page.evaluate<{ itemCount: number; version: number }>(
      `(async () => {
        const { cartsStore } = window.__kurioMock.stores
        const cart = await cartsStore.get('cart-' + ${JSON.stringify(USER.id)})
        return { itemCount: cart.itemCount, version: cart.version }
      })()`,
    )
    expect(cartDuringPending.itemCount).toBe(5)
    expect(cartDuringPending.version).toBe(1)

    const stockDuringPending = await page.evaluate<number>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      return nft?.editions[0]?.available ?? -1
    })()`)
    expect(stockDuringPending).toBe(100)

    // 1b. Pedido recusado não altera o carrinho nem o estoque
    await seedOrder(page, { status: 'declined', declineReason: 'Cartão recusado' })
    const cartDuringDeclined = await page.evaluate<{ itemCount: number; version: number }>(
      `(async () => {
        const { cartsStore } = window.__kurioMock.stores
        const cart = await cartsStore.get('cart-' + ${JSON.stringify(USER.id)})
        return { itemCount: cart.itemCount, version: cart.version }
      })()`,
    )
    expect(cartDuringDeclined.itemCount).toBe(5)
    expect(cartDuringDeclined.version).toBe(1)

    const stockDuringDeclined = await page.evaluate<number>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get('emerald-ape-042')
      return nft?.editions[0]?.available ?? -1
    })()`)
    expect(stockDuringDeclined).toBe(100)

    // 1c. Liquidação do pedido confirmado com compra parcial:
    // Comprou 2 de Emerald Ape e 1 de Violet Nomad.
    // Ivory Baron (1 un) e a sobra de Emerald Ape (1 un) continuam.
    const partialOrderId = await page.evaluate<string>(`(async () => {
      const { ordersStore, nftsStore } = window.__kurioMock.stores
      const id = 'ord-' + crypto.randomUUID()
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet

      const emerald = await nftsStore.get('emerald-ape-042')
      const violet = await nftsStore.get('violet-nomad-314')

      const record = {
        id,
        userId: ${JSON.stringify(USER.id)},
        status: 'pending',
        createdAt: new Date(Date.now() - 35_000).toISOString(),
        quoteId: 'quote-' + id,
        network: 'ethereum',
        wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
        collector,
        items: [
          {
            nftId: emerald.id,
            editionId: emerald.editions[0].id,
            name: emerald.name,
            tokenId: emerald.tokenId,
            image: { src: emerald.image.src, alt: emerald.name },
            editionLabel: emerald.editions[0].label,
            quantity: 2,
            unitPrice: '1.19',
            lineTotal: '2.38',
          },
          {
            nftId: violet.id,
            editionId: violet.editions[0].id,
            name: violet.name,
            tokenId: violet.tokenId,
            image: { src: violet.image.src, alt: violet.name },
            editionLabel: violet.editions[0].label,
            quantity: 1,
            unitPrice: '1.39',
            lineTotal: '1.39',
          },
        ],
        subtotal: '3.77',
        discount: '0.00',
        networkFee: '0.016',
        total: '3.786',
      }
      await ordersStore.put(record)
      return id
    })()`)

    // Aciona a liquidação chamando GET /orders/:id
    await page.evaluate(
      `(async () => { await window.__kurio.http.get('/orders/' + ${JSON.stringify(partialOrderId)}) })()`,
    )

    // Confere o estado do carrinho após a compra parcial:
    // - Emerald Ape agora tem quantidade 1 e lineTotal recalculado
    // - Violet Nomad foi removido por inteiro
    // - Ivory Baron continua intacto com quantidade 1
    // - Cupom PROMO10 foi mantido pois ainda sobram itens
    // - Versão foi incrementada de 1 para 2
    // - itemCount total é 2 (1 de Emerald + 1 de Ivory)
    const partialCart = await page.evaluate<{
      items: { nftId: string; quantity: number; lineTotal: string }[]
      itemCount: number
      version: number
      couponCode?: string
    }>(`(async () => {
      const { cartsStore } = window.__kurioMock.stores
      const cart = await cartsStore.get('cart-' + ${JSON.stringify(USER.id)})
      return {
        items: cart.items.map((i) => ({ nftId: i.nft.id, quantity: i.quantity, lineTotal: i.lineTotal })),
        itemCount: cart.itemCount,
        version: cart.version,
        couponCode: cart.coupon?.code,
      }
    })()`)

    expect(partialCart.itemCount).toBe(2)
    expect(partialCart.version).toBe(2)
    expect(partialCart.couponCode).toBe('PROMO10')
    expect(partialCart.items).toHaveLength(2)

    const remainingEmerald = partialCart.items.find((i) => i.nftId === 'emerald-ape-042')
    expect(remainingEmerald?.quantity).toBe(1)
    expect(remainingEmerald?.lineTotal).toBe('1.19')

    const remainingIvory = partialCart.items.find((i) => i.nftId === 'ivory-baron-088')
    expect(remainingIvory?.quantity).toBe(1)

    const remainingViolet = partialCart.items.find((i) => i.nftId === 'violet-nomad-314')
    expect(remainingViolet).toBeUndefined()

    // Atualiza a página e confere o contador do cabeçalho / barra (aria-label acessível em ambos)
    await page.goto('/')
    await ready(page)
    const cartButton = page.getByRole('link', { name: 'Carrinho, 2 itens' })
    await expect(cartButton).toBeVisible()

    // 1d. Compra final dos itens restantes esvazia o carrinho e remove o cupom
    const finalOrderId = await page.evaluate<string>(`(async () => {
      const { ordersStore, nftsStore } = window.__kurioMock.stores
      const id = 'ord-' + crypto.randomUUID()
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet

      const emerald = await nftsStore.get('emerald-ape-042')
      const ivory = await nftsStore.get('ivory-baron-088')

      const record = {
        id,
        userId: ${JSON.stringify(USER.id)},
        status: 'pending',
        createdAt: new Date(Date.now() - 35_000).toISOString(),
        quoteId: 'quote-' + id,
        network: 'ethereum',
        wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
        collector,
        items: [
          {
            nftId: emerald.id,
            editionId: emerald.editions[0].id,
            name: emerald.name,
            tokenId: emerald.tokenId,
            image: { src: emerald.image.src, alt: emerald.name },
            editionLabel: emerald.editions[0].label,
            quantity: 1,
            unitPrice: '1.19',
            lineTotal: '1.19',
          },
          {
            nftId: ivory.id,
            editionId: ivory.editions[0].id,
            name: ivory.name,
            tokenId: ivory.tokenId,
            image: { src: ivory.image.src, alt: ivory.name },
            editionLabel: ivory.editions[0].label,
            quantity: 1,
            unitPrice: '1.79',
            lineTotal: '1.79',
          },
        ],
        subtotal: '2.98',
        discount: '0.00',
        networkFee: '0.016',
        total: '2.996',
      }
      await ordersStore.put(record)
      return id
    })()`)

    await page.evaluate(
      `(async () => { await window.__kurio.http.get('/orders/' + ${JSON.stringify(finalOrderId)}) })()`,
    )

    // O carrinho agora está vazio, sem cupom e com versão incrementada para 3
    const emptyCart = await page.evaluate<{
      itemsLength: number
      itemCount: number
      version: number
      hasCoupon: boolean
    }>(`(async () => {
      const { cartsStore } = window.__kurioMock.stores
      const cart = await cartsStore.get('cart-' + ${JSON.stringify(USER.id)})
      return {
        itemsLength: cart.items.length,
        itemCount: cart.itemCount,
        version: cart.version,
        hasCoupon: cart.coupon !== undefined,
      }
    })()`)

    expect(emptyCart.itemsLength).toBe(0)
    expect(emptyCart.itemCount).toBe(0)
    expect(emptyCart.version).toBe(3)
    expect(emptyCart.hasCoupon).toBe(false)

    // Na interface, o link volta a ser apenas "Carrinho" sem contagem
    await page.goto('/')
    await ready(page)
    await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()
  })

  test('2. GET /orders/:id só do dono, pendente sem vencidos, liquidação concorrente sem duplicar baixa e snapshot imutável', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await scenarios(page, 'payment-confirmed')
    await setupSignedIn(page)

    // Prepara estoque controlado para teste de concorrência
    const testNftId = 'emerald-ape-042'
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get(${JSON.stringify(testNftId)})
      if (nft) {
        nft.editions = [{ id: 'ed-conc-1', label: '1/50', supply: 50, available: 20, price: '1.00' }]
        await nftsStore.put(nft)
      }
    })()`)

    // 2a. GET /orders/:id só do dono
    const primaryOrderId = await seedOrder(page, { status: 'confirmed', userId: USER.id })
    const ownCheck = await page.evaluate<{ status: number }>(`(async () => {
      try {
        const res = await window.__kurio.http.get('/orders/' + ${JSON.stringify(primaryOrderId)})
        return { status: res.status }
      } catch (err) {
        return { status: err.status }
      }
    })()`)
    expect(ownCheck.status).toBe(200)

    // Troca para outro usuário e tenta acessar o pedido
    await page.evaluate(`window.__kurio.clearPrivateSession()`)
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.other)})`)
    const otherCheck = await page.evaluate<{ status: number }>(`(async () => {
      try {
        const res = await window.__kurio.http.get('/orders/' + ${JSON.stringify(primaryOrderId)})
        return { status: res.status }
      } catch (err) {
        return { status: err.status }
      }
    })()`)
    expect(otherCheck.status).toBe(403)

    // Volta ao usuário primary
    await page.evaluate(`window.__kurio.clearPrivateSession()`)
    await page.evaluate(`window.__kurio.auth.signIn(${JSON.stringify(users.primary)})`)

    // 2b. GET /orders?status=pending só do usuário e liquida pedidos vencidos
    const pendingDueId = await page.evaluate<string>(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const id = 'ord-' + crypto.randomUUID()
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      const record = {
        id,
        userId: ${JSON.stringify(USER.id)},
        status: 'pending',
        createdAt: new Date(Date.now() - 35_000).toISOString(),
        quoteId: 'quote-' + id,
        network: 'ethereum',
        wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
        collector,
        items: [
          {
            nftId: ${JSON.stringify(testNftId)},
            editionId: 'ed-conc-1',
            name: 'Emerald Ape #042',
            tokenId: '#042',
            image: { src: '/placeholder.webp', alt: 'Emerald Ape' },
            editionLabel: '1/50',
            quantity: 1,
            unitPrice: '1.00',
            lineTotal: '1.00',
          },
        ],
        subtotal: '1.00',
        discount: '0.00',
        networkFee: '0.016',
        total: '1.016',
      }
      await ordersStore.put(record)
      return id
    })()`)

    // Ao chamar GET /orders?status=pending, settleIfDue liquida o pedido vencido
    const pendingList = await page.evaluate<{ id: string }[]>(`(async () => {
      const res = await window.__kurio.http.get('/orders?status=pending')
      return res.data
    })()`)
    // O pedido vencido não aparece mais na lista de pendentes pois foi liquidado
    expect(pendingList.some((o) => o.id === pendingDueId)).toBe(false)

    // 2c. Duas liquidações simultâneas baixam o estoque UMA única vez
    const concurrentOrderId = await page.evaluate<string>(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const id = 'ord-' + crypto.randomUUID()
      const wallet = (await window.__kurio.http.get('/wallets')).data.primary
      const { id: walletId, slot, ...collector } = wallet
      const record = {
        id,
        userId: ${JSON.stringify(USER.id)},
        status: 'pending',
        createdAt: new Date(Date.now() - 35_000).toISOString(),
        quoteId: 'quote-' + id,
        network: 'ethereum',
        wallet: { label: 'MetaMask', provider: 'metamask', address: wallet.address },
        collector,
        items: [
          {
            nftId: ${JSON.stringify(testNftId)},
            editionId: 'ed-conc-1',
            name: 'Emerald Ape #042',
            tokenId: '#042',
            image: { src: '/placeholder.webp', alt: 'Emerald Ape' },
            editionLabel: '1/50',
            quantity: 5,
            unitPrice: '1.00',
            lineTotal: '5.00',
          },
        ],
        subtotal: '5.00',
        discount: '0.00',
        networkFee: '0.016',
        total: '5.016',
      }
      await ordersStore.put(record)
      return id
    })()`)

    // Dispara duas consultas GET concorrentes que acionam settleIfDue
    await page.evaluate(`(async () => {
      await Promise.all([
        window.__kurio.http.get('/orders/' + ${JSON.stringify(concurrentOrderId)}),
        window.__kurio.http.get('/orders/' + ${JSON.stringify(concurrentOrderId)}),
      ])
    })()`)

    // Estoque inicial era 20 (menos 1 do teste 2b = 19), comprou 5 -> deve ser exatamente 14 (baixado 1 vez só)
    const stockAfter = await page.evaluate<number>(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      const nft = await nftsStore.get(${JSON.stringify(testNftId)})
      const ed = nft?.editions.find((e) => e.id === 'ed-conc-1')
      return ed?.available ?? -1
    })()`)
    expect(stockAfter).toBe(14)

    // 2d. txHash formato 0x + 64 hexadecimais
    const settledOrder = await page.evaluate<{ status: string; txHash?: string }>(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(concurrentOrderId)})
      return { status: order.status, txHash: order.txHash }
    })()`)
    expect(settledOrder.status).toBe('confirmed')
    expect(settledOrder.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/)

    // 2e. Snapshot imutável no mock após o desfecho
    const snapshotBefore = await page.evaluate<string>(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(concurrentOrderId)})
      return JSON.stringify(order.items)
    })()`)

    // Tenta sobrescrever o catálogo
    await page.evaluate(`(async () => {
      const { nftsStore } = window.__kurioMock.stores
      await nftsStore.delete(${JSON.stringify(testNftId)})
    })()`)

    const snapshotAfter = await page.evaluate<string>(`(async () => {
      const { ordersStore } = window.__kurioMock.stores
      const order = await ordersStore.get(${JSON.stringify(concurrentOrderId)})
      return JSON.stringify(order.items)
    })()`)
    expect(snapshotAfter).toBe(snapshotBefore)
  })
})
