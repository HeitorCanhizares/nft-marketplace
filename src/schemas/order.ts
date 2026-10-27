import { z } from 'zod'
import type {
  CreateOrderInput,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  QuoteChange,
} from '@/types/order'
import {
  ethAmountSchema,
  isoDateSchema,
  networkSchema,
  positiveIntSchema,
  walletAddressSchema,
  walletProviderSchema,
} from '@/schemas/common'
import { walletSchema } from '@/schemas/user'
import { quoteSchema } from '@/schemas/cart'
import type { Quote } from '@/types/cart'

// Collector: campos de Wallet sem id/slot, derivado de walletSchema.
export const collectorSchema = walletSchema.omit({ id: true, slot: true })

// Collector gravado no pedido: wallet-like + nota opcional.
const orderCollectorSchema: z.ZodType<Order['collector']> = collectorSchema.extend({
  note: z.string().optional(),
})

export const orderStatusSchema: z.ZodType<OrderStatus> = z.enum([
  'pending',
  'confirmed',
  'declined',
])

const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

export const orderItemSnapshotSchema: z.ZodType<OrderItemSnapshot> = z.object({
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  editionId: z.string(),
  editionLabel: z.string(),
  quantity: positiveIntSchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
})

export const orderSchema: z.ZodType<Order> = z.object({
  id: z.string(),
  status: orderStatusSchema,
  createdAt: isoDateSchema,
  quoteId: z.string(),
  txHash: z.string().optional(),
  declineReason: z.string().optional(),
  network: networkSchema,
  wallet: z.object({
    label: z.string(),
    provider: walletProviderSchema,
    address: walletAddressSchema,
  }),
  collector: orderCollectorSchema,
  items: z.array(orderItemSnapshotSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  coupon: z.object({ code: z.string() }).optional(),
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  explorerUrl: z.string().optional(),
})

export const quoteChangeSchema: z.ZodType<QuoteChange> = z.enum([
  'PRICE_CHANGED',
  'SOLD_OUT',
  'COUPON_EXPIRED',
  'FEE_CHANGED',
])

// Corpo do POST /orders (usado depois pelo formulário do Pagamento).
export const createOrderInputSchema: z.ZodType<CreateOrderInput> = z.object({
  quoteId: z.string(),
  collector: collectorSchema,
  walletId: z.string().optional(),
  network: networkSchema,
  provider: walletProviderSchema,
  walletAddress: walletAddressSchema,
  note: z.string().optional(),
})

export const ordersSchema: z.ZodType<Order[]> = z.array(orderSchema)

export const quoteChangedDetailsSchema: z.ZodType<{ quote: Quote; changes: QuoteChange[] }> =
  z.object({
    quote: quoteSchema,
    changes: z.array(quoteChangeSchema),
  })
