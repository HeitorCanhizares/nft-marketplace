import { http, HttpResponse } from 'msw'

import { diffQuotes, toChangeCodes } from '@/lib/quoteDiff'
import { providerLabel } from '@/lib/walletOptions'
import { createOrderInputSchema } from '@/schemas/order'
import type { CreateOrderInput, OrderStatus } from '@/types/order'
import type { Quote } from '@/types/cart'
import { buildQuote } from '../db/quote'
import { userCartId } from '../db/cartMerge'
import type { OrderRecord } from '../db/db'
import { hashBody, snapshotItems, toOrder } from '../db/orderOps'
import { armSettlement, settleIfDue } from '../db/orderLifecycle'
import { cartsStore, idempotencyStore, ordersStore, quotesStore } from '../db/stores'
import { apiPath } from '../scenarios/config'
import { apiError, validationError } from '../scenarios/errors'
import { withMock } from '../scenarios/middleware'
import { dropConnections } from '../realtime/server'
import {
  forceQuoteChange,
  holdAfterCreate,
  isForbiddenOrderScenario,
  isForcedQuote,
  maybeSessionExpired,
  perturbBeforeRevalidation,
  REALTIME_DROP_MS,
  shouldDropRealtime,
} from '../db/orderScenarios'
import { authenticate } from './sessionGuard'

const PENDING: OrderStatus = 'pending'
const FORBIDDEN_ORDER_MESSAGE = 'Você não tem acesso a este pedido.'

// Só status=pending é suportado.
function isPendingFilter(value: string | null): boolean {
  return value === PENDING
}

export const ordersHandlers = [
  http.get(
    apiPath('/orders'),
    withMock(
      'GET /orders',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        if (!isPendingFilter(new URL(request.url).searchParams.get('status'))) {
          return apiError('BAD_REQUEST')
        }

        // Liquida o que já passou do prazo antes de filtrar, para não listar pendente vencido.
        const records = await ordersStore.listByUserId(auth.user.id)
        const current = await Promise.all(
          records.map(async (record) => {
            const settled = await settleIfDue(record)
            if (settled.status === PENDING) armSettlement(settled)
            return settled
          }),
        )
        const pending = current
          .filter((record) => record.status === PENDING)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

        return HttpResponse.json(pending.map(toOrder))
      },
      { protected: true },
    ),
  ),
  http.get(
    apiPath('/orders/:id'),
    withMock(
      'GET /orders/:id',
      async ({ request, params }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        if (isForbiddenOrderScenario()) {
          return apiError('FORBIDDEN', { message: FORBIDDEN_ORDER_MESSAGE })
        }

        const id = params.id
        if (typeof id !== 'string') return apiError('BAD_REQUEST')

        const record = await ordersStore.get(id)
        if (record === undefined) {
          return apiError('NOT_FOUND', { message: 'Pedido não encontrado.' })
        }
        if (record.userId !== auth.user.id) {
          return apiError('FORBIDDEN', { message: FORBIDDEN_ORDER_MESSAGE })
        }

        // realtime-drop: a primeira consulta de pedido pendente derruba o socket; o polling assume.
        if (record.status === PENDING && shouldDropRealtime()) {
          dropConnections(REALTIME_DROP_MS)
        }

        const settled = await settleIfDue(record)
        if (settled.status === PENDING) armSettlement(settled)

        return HttpResponse.json(toOrder(settled))
      },
      { protected: true },
    ),
  ),
  http.post(
    apiPath('/orders'),
    withMock(
      'POST /orders',
      async ({ request }) => {
        const auth = await authenticate(request)
        if (auth instanceof Response) return auth

        if (maybeSessionExpired()) return apiError('SESSION_EXPIRED')

        const key = request.headers.get('Idempotency-Key')?.trim() ?? ''
        if (key === '') return apiError('BAD_REQUEST')

        const raw: unknown = await request.json().catch(() => null)
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          return apiError('BAD_REQUEST')
        }

        const parsed = createOrderInputSchema.safeParse(raw)
        if (!parsed.success) return validationError(parsed.error)
        const body: CreateOrderInput = parsed.data

        // Idempotência: mesma chave e mesmo corpo devolvem o pedido já criado.
        const bodyHash = await hashBody(raw)
        const previous = await idempotencyStore.get(key)
        if (previous !== undefined) {
          if (previous.bodyHash !== bodyHash) return apiError('IDEMPOTENCY_KEY_REUSED')
          const existing = await ordersStore.get(previous.orderId)
          if (existing !== undefined) return HttpResponse.json(toOrder(existing))
        }

        const stored = await quotesStore.get(body.quoteId)
        if (stored === undefined || Date.parse(stored.expiresAt) <= Date.now()) {
          return apiError('QUOTE_EXPIRED')
        }

        const cart = await cartsStore.get(userCartId(auth.user.id))
        if (cart === undefined || cart.items.length === 0 || cart.version !== stored.cartVersion) {
          return apiError('CART_CHANGED')
        }

        // Cenários forçados: a cotação forçada é a verdade do cenário e pula a revalidação.
        await perturbBeforeRevalidation(stored)
        let source: Quote = stored
        if (!isForcedQuote(body.quoteId)) {
          const fresh = await buildQuote(cart, { network: body.network })
          const forcedChange = await forceQuoteChange(fresh)
          if (forcedChange !== null) {
            return apiError('QUOTE_CHANGED', {
              details: {
                quote: forcedChange,
                changes: toChangeCodes(diffQuotes(stored, forcedChange)),
              },
            })
          }

          // Revalidação: recalcula a cotação com o estado atual.
          const entries = diffQuotes(stored, fresh)
          for (const item of fresh.items) {
            if (
              item.availability === 'sold_out' &&
              !entries.some((entry) => entry.kind === 'SOLD_OUT' && entry.itemId === item.id)
            ) {
              entries.push({ kind: 'SOLD_OUT', itemId: item.id, name: item.nft.name })
            }
          }
          if (entries.length > 0) {
            return apiError('QUOTE_CHANGED', {
              details: { quote: fresh, changes: toChangeCodes(entries) },
            })
          }
          if (fresh.items.some((item) => item.availability === 'insufficient')) {
            return apiError('QUANTITY_EXCEEDS_STOCK')
          }
          source = fresh
        }

        const record: OrderRecord = {
          id: 'ord-' + crypto.randomUUID(),
          status: PENDING,
          createdAt: new Date().toISOString(),
          quoteId: body.quoteId,
          network: body.network,
          wallet: {
            label: providerLabel(body.provider),
            provider: body.provider,
            address: body.walletAddress,
          },
          collector: {
            ...body.collector,
            ...(body.note ? { note: body.note } : {}),
          },
          items: snapshotItems(source),
          subtotal: source.subtotal,
          discount: source.discount,
          ...(source.coupon?.status === 'applied' ? { coupon: { code: source.coupon.code } } : {}),
          networkFee: source.networkFee,
          total: source.total,
          userId: auth.user.id,
        }

        await ordersStore.put(record)
        await idempotencyStore.put({
          key,
          bodyHash,
          orderId: record.id,
          createdAt: record.createdAt,
        })

        armSettlement(record)

        // order-timeout: o pedido já foi gravado; a resposta demora além do timeout do cliente.
        await holdAfterCreate(key)

        return HttpResponse.json(toOrder(record), { status: 201 })
      },
      { protected: true },
    ),
  ),
]
