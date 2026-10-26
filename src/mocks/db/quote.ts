import { quoteSchema } from '@/schemas/cart'
import type { Network, WalletProvider } from '@/types/nft'
import type { Quote } from '@/types/cart'
import { findCoupon } from '../seed/coupons'
import { mockConfig } from '../scenarios/config'
import type { CartRecord } from './db'
import { ethToUnits, unitsToEth } from './money'
import { quotesStore } from './stores'
import { toCartResponse } from './cartOps'

export type QuoteInput = { network?: Network; provider?: WalletProvider }

// Taxa fixa por rede, sempre estimada, cobrada uma vez por cotação.
const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0005',
}

// Cotação do carrinho: preço e estoque atuais, comparados com o preço gravado em cada linha.
// Toda conta é feita em unidades de 0,000001 ETH.
export async function buildQuote(cart: CartRecord, input: QuoteInput): Promise<Quote> {
  const current = await toCartResponse(cart)
  const storedPrices = new Map(cart.items.map((line) => [line.id, line.unitPrice]))

  const items = current.items.map((item): Quote['items'][number] => {
    const stored = storedPrices.get(item.id)
    const changed =
      item.availability !== 'sold_out' &&
      stored !== undefined &&
      ethToUnits(stored) !== ethToUnits(item.unitPrice)
    return changed ? { ...item, priceChanged: { from: stored, to: item.unitPrice } } : item
  })

  // Linha esgotada fica fora do subtotal.
  const payable = items.filter((item) => item.availability !== 'sold_out')
  const subtotalUnits = payable.reduce((sum, item) => sum + ethToUnits(item.lineTotal), 0)

  const feeUnits = payable.length === 0 ? 0 : ethToUnits(NETWORK_FEES[input.network ?? 'ethereum'])

  let discountUnits = 0
  let coupon: Quote['coupon']
  if (cart.coupon !== undefined) {
    const terms = findCoupon(cart.coupon.code)
    if (terms === undefined || terms.expired) {
      coupon = {
        code: cart.coupon.code,
        status: 'expired',
        message: 'Este código promocional expirou.',
      }
    } else {
      discountUnits = Math.floor((subtotalUnits * terms.percent) / 100)
      coupon = { code: cart.coupon.code, status: 'applied', message: 'Cupom aplicado.' }
    }
  }

  const warnings: Quote['warnings'] = []
  if (items.some((item) => item.priceChanged !== undefined)) warnings.push('PRICE_CHANGED')
  if (items.some((item) => item.availability === 'sold_out')) warnings.push('SOLD_OUT')
  if (
    items.some((item) => item.availability === 'low_stock' || item.availability === 'insufficient')
  ) {
    warnings.push('LOW_STOCK')
  }

  const quote: Quote = {
    id: 'quote-' + crypto.randomUUID(),
    expiresAt: new Date(Date.now() + mockConfig.quoteTtlSeconds * 1000).toISOString(),
    cartVersion: cart.version,
    items,
    subtotal: unitsToEth(subtotalUnits),
    discount: unitsToEth(discountUnits),
    networkFee: unitsToEth(feeUnits),
    networkFeeEstimated: true,
    total: unitsToEth(subtotalUnits - discountUnits + feeUnits),
    ...(coupon === undefined ? {} : { coupon }),
    warnings,
  }

  const validated = quoteSchema.parse(quote)
  await quotesStore.put(validated)
  return validated
}
