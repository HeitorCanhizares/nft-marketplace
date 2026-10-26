import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { quote } from '@/hooks/queryKeys'
import { getQuote } from '@/services/api/cart'
import type { Cart } from '@/types/cart'

// Cotação do carrinho: o servidor calcula os valores, o front só exibe.
// Enquanto recalcula, mantém a cotação anterior na tela (isUpdating).
export function useCartQuote(cart: Cart | undefined) {
  const query = useQuery({
    queryKey: quote({ cartVersion: cart?.version, coupon: cart?.coupon?.code ?? null }),
    queryFn: ({ signal }) => getQuote(signal),
    enabled: cart !== undefined && cart.items.length > 0,
    placeholderData: keepPreviousData,
  })

  return {
    quote: query.data,
    isUpdating: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  }
}
