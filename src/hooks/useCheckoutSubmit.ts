import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { clearPending, readPending, setPendingOrderId, writePending } from '@/lib/checkoutStorage'
import { createOrder, readQuoteChanged } from '@/services/api/orders'
import { isRetryable, toApiError } from '@/services/http/ApiError'
import { getWalletProvider } from '@/services/wallet'
import type { Quote } from '@/types/cart'
import type { CreateOrderInput, Order } from '@/types/order'

export type SubmitPhase = 'idle' | 'signing' | 'sending' | 'confirming'

export type SubmitResult =
  | { kind: 'created'; order: Order }
  | { kind: 'changed'; quote: Quote } // 409 QUOTE_CHANGED: usar a cotação nova
  | { kind: 'stale' } // 409 QUOTE_EXPIRED ou CART_CHANGED: refazer a cotação
  | { kind: 'cancelled'; message: string } // assinatura recusada
  | { kind: 'failed'; message: string } // demais falhas

export type SubmitInput = {
  userId: string
  quote: Quote
  request: Omit<CreateOrderInput, 'quoteId'>
}

const CHECKOUT_SUBMIT_KEY = ['checkout-submit'] as const

const MAX_ATTEMPTS = 3
const RETRY_DELAYS_MS = [500, 1000] as const

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Erro do provedor de carteira: um objeto com `code`, não um ApiError.
function walletErrorCode(reason: unknown): string | null {
  if (typeof reason === 'object' && reason !== null && 'code' in reason) {
    const { code } = reason
    if (typeof code === 'string') return code
  }
  return null
}

// Envio do pedido com assinatura, chave de idempotência e reenvio. Não lança: devolve SubmitResult.
export function useCheckoutSubmit() {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()
  const [phase, setPhase] = useState<SubmitPhase>('idle')

  // Promessa em andamento, guardada fora do render.
  const inFlight = useRef<Promise<SubmitResult> | null>(null)

  async function runSubmit(input: SubmitInput): Promise<SubmitResult> {
    const { userId, quote, request } = input

    const pending = readPending(userId)
    let key: string

    if (pending && pending.quoteId === quote.id) {
      // Reenvio ou "Tentar novamente": mesma chave, sem nova assinatura.
      key = pending.key
    } else {
      key = crypto.randomUUID()
      setPhase('signing')
      announce('Processando...', 'polite')

      const provider = getWalletProvider()
      if (!provider) return { kind: 'failed', message: 'Carteira indisponível.' }

      try {
        await provider.signOrder(quote.id)
      } catch (reason) {
        const code = walletErrorCode(reason)
        if (code === 'SIGN_REJECTED') {
          return { kind: 'cancelled', message: 'Pagamento cancelado na carteira' }
        }
        if (code === 'DISCONNECTED') {
          return { kind: 'failed', message: 'Carteira desconectada. Conecte novamente.' }
        }
        return { kind: 'failed', message: 'Não foi possível concluir a ação. Tente novamente.' }
      }

      writePending({
        userId,
        quoteId: quote.id,
        key,
        request: { ...request, quoteId: quote.id },
      })
    }

    setPhase('sending')
    const body: CreateOrderInput = { ...request, quoteId: quote.id }

    let order: Order | null = null
    let lastError: unknown = null

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        order = await createOrder(body, key)
        break
      } catch (error) {
        lastError = error
        if (!isRetryable(error) || attempt === MAX_ATTEMPTS) break

        // A partir da segunda tentativa a espera vira "Confirmando seu pedido...".
        setPhase('confirming')
        announce('Confirmando seu pedido...', 'polite')
        await wait(RETRY_DELAYS_MS[attempt - 1])
      }
    }

    if (order) {
      setPendingOrderId(order.id)
      return { kind: 'created', order }
    }

    const error = toApiError(lastError)

    if (error.code === 'QUOTE_CHANGED') {
      const nextQuote = readQuoteChanged(lastError)
      if (nextQuote) {
        clearPending()
        return { kind: 'changed', quote: nextQuote }
      }
    }

    if (error.code === 'QUOTE_EXPIRED' || error.code === 'CART_CHANGED') {
      clearPending()
      return { kind: 'stale' }
    }

    // Registro pendente (com a chave) fica gravado para o próximo "Tentar novamente".
    if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
      return { kind: 'failed', message: 'Não conseguimos confirmar seu pedido.' }
    }
    return { kind: 'failed', message: error.message }
  }

  const mutation = useMutation({
    mutationKey: CHECKOUT_SUBMIT_KEY,
    mutationFn: async (input: SubmitInput): Promise<SubmitResult> => {
      try {
        return await runSubmit(input)
      } finally {
        setPhase('idle')
      }
    },
  })

  // Trava de clique repetido: enquanto houver envio em andamento, devolve a mesma promessa.
  function submit(input: SubmitInput): Promise<SubmitResult> {
    if (inFlight.current && queryClient.isMutating({ mutationKey: CHECKOUT_SUBMIT_KEY }) > 0) {
      return inFlight.current
    }
    const promise = mutation.mutateAsync(input)
    inFlight.current = promise
    return promise
  }

  return { submit, phase, isSubmitting: mutation.isPending }
}
