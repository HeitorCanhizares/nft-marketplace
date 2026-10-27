import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

import { quote } from '@/hooks/queryKeys'
import { getCheckoutQuote } from '@/services/api/orders'
import type { Cart, Quote } from '@/types/cart'
import type { Network } from '@/types/nft'

const MIN_REFRESH_MS = 1000

function checkoutQuoteKey(cart: Cart | undefined, network: Network | null) {
  return quote({
    checkout: true,
    cartVersion: cart?.version,
    coupon: cart?.coupon?.code ?? null,
    network,
  })
}

function checkoutQuoteRequest(network: Network | null) {
  return ({ signal }: { signal: AbortSignal }) =>
    getCheckoutQuote({ network: network ?? undefined }, signal)
}

// Tempo até a cotação vencer (mínimo 1 s). Sem cotação ou data inválida, não há refetch automático.
function msUntilQuoteExpires(data: Quote | undefined): number | false {
  if (!data) return false

  const expiry = Date.parse(data.expiresAt)
  if (Number.isNaN(expiry)) return false

  return Math.max(MIN_REFRESH_MS, expiry - Date.now())
}

// Cotação do Pagamento: refeita ao mudar carrinho, cupom ou rede, e ao vencer.
// Enquanto recalcula, mantém a cotação anterior na tela (isUpdating).
export function useCheckoutQuote(cart: Cart | undefined, network: Network | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: checkoutQuoteKey(cart, network),
    queryFn: checkoutQuoteRequest(network),
    enabled: cart !== undefined && cart.items.length > 0,
    placeholderData: keepPreviousData,
    refetchInterval: (current) => msUntilQuoteExpires(current.state.data),
  })

  // Cotação nova garantida: staleTime 0 força a ida ao servidor e atualiza o cache.
  function refresh(): Promise<Quote> {
    return queryClient.fetchQuery({
      queryKey: checkoutQuoteKey(cart, network),
      queryFn: checkoutQuoteRequest(network),
      staleTime: 0,
    })
  }

  return {
    quote: query.data,
    isUpdating: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    refresh,
  }
}
