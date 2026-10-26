import { z } from 'zod'
import type { Cart, CartItem, Quote } from '@/types/cart'
import { ethAmountSchema, isoDateSchema, positiveIntSchema } from '@/schemas/common'
import { nftSummarySchema } from '@/schemas/nft'

const cartItemShape = {
  id: z.string(),
  nft: nftSummarySchema,
  edition: z.object({ id: z.string(), label: z.string() }),
  quantity: positiveIntSchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  availability: z.enum(['available', 'low_stock', 'sold_out', 'insufficient']),
  available: z.number().int().nullable(),
}

export const cartItemSchema: z.ZodType<CartItem> = z.object(cartItemShape)

export const cartSchema: z.ZodType<Cart> = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  itemCount: z.number().int().min(0),
  version: z.number().int().min(0),
  coupon: z.object({ code: z.string() }).optional(),
})

// Item da cotação: o item do carrinho, com a diferença de preço quando houver.
const quoteItemSchema = z.object({
  ...cartItemShape,
  priceChanged: z.object({ from: ethAmountSchema, to: ethAmountSchema }).optional(),
})

export const quoteSchema: z.ZodType<Quote> = z.object({
  id: z.string(),
  expiresAt: isoDateSchema,
  cartVersion: z.number().int().min(0),
  items: z.array(quoteItemSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  networkFeeEstimated: z.boolean(),
  total: ethAmountSchema,
  coupon: z
    .object({
      code: z.string(),
      status: z.enum(['applied', 'invalid', 'expired']),
      message: z.string(),
    })
    .optional(),
  warnings: z.array(z.enum(['PRICE_CHANGED', 'SOLD_OUT', 'LOW_STOCK'])),
})
