import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useAuth } from '@/contexts/auth'
import { cart } from '@/hooks/queryKeys'
import { getCart } from '@/services/api/cart'

// Carrinho do usuário ou do visitante. Sem throwOnError: quem usa trata `data` indefinido como 0.
export function useCart() {
  const { status } = useAuth()
  const queryClient = useQueryClient()
  const previousStatus = useRef(status)

  // Entrar ou sair muda o dono do carrinho (login mescla o do visitante): relê a query.
  useEffect(() => {
    if (previousStatus.current === status) return
    const wasLoading = previousStatus.current === 'loading'
    previousStatus.current = status
    if (wasLoading) return
    void queryClient.invalidateQueries({ queryKey: cart })
  }, [status, queryClient])

  return useQuery({
    queryKey: cart,
    queryFn: ({ signal }) => getCart(signal),
    enabled: status !== 'loading',
  })
}
