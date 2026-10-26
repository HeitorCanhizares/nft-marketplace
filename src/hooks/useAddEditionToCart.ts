import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, nfts } from '@/hooks/queryKeys'
import { ensureGuestCartId, readSession } from '@/lib/session'
import { addCartItem } from '@/services/api/cart'
import { isApiError } from '@/services/http/ApiError'
import type { NftDetail } from '@/types/nft'

export type AddEditionMode = 'buy' | 'cart'

type AddVars = { editionId: string; quantity: number; mode: AddEditionMode }

export type AddEditionError = { editionId: string; message: string }

const MUTATION_KEY = ['add-to-cart-detail'] as const
const ADDED_MS = 2000

// Adiciona uma edição ao carrinho a partir do detalhe. COMPRAR só leva ao carrinho (não adiciona aqui).
export function useAddEditionToCart(nft: NftDetail) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { announce } = useLiveAnnouncer()
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<AddEditionError | null>(null)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (addedTimer.current !== null) clearTimeout(addedTimer.current)
    }
  }, [])

  const mutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ editionId, quantity }: AddVars) =>
      addCartItem({ nftId: nft.id, editionId, quantity }),
    onSuccess: (cartData, { mode }) => {
      queryClient.setQueryData(cart, cartData)
      if (mode === 'buy') {
        void navigate({ to: '/carrinho' })
        return
      }
      announce('Adicionado ao carrinho', 'polite')
      setAdded(true)
      if (addedTimer.current !== null) clearTimeout(addedTimer.current)
      addedTimer.current = setTimeout(() => {
        addedTimer.current = null
        setAdded(false)
      }, ADDED_MS)
    },
    onError: (failure, { editionId }) => {
      if (isApiError(failure) && failure.code === 'SOLD_OUT') {
        setError({ editionId, message: 'Esta edição esgotou.' })
        void queryClient.invalidateQueries({ queryKey: nfts.detail(nft.id) })
        void queryClient.invalidateQueries({ queryKey: cart })
      } else if (isApiError(failure) && failure.code === 'QUANTITY_EXCEEDS_STOCK') {
        setError({
          editionId,
          message: 'Você já tem o máximo disponível desta edição no carrinho.',
        })
        void queryClient.invalidateQueries({ queryKey: nfts.detail(nft.id) })
        void queryClient.invalidateQueries({ queryKey: cart })
      } else {
        toast.error('Não foi possível adicionar ao carrinho. Tente de novo.')
      }
    },
  })

  function add(input: { editionId: string; quantity: number; mode: AddEditionMode }): void {
    // Trava síncrona: dois cliques seguidos antes do render não disparam duas requisições.
    if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) > 0) return

    setError(null)
    // Visitante sem sessão: o carrinho é identificado pelo X-Cart-Id, criado aqui se ainda não existe.
    if (readSession() === null) ensureGuestCartId()

    mutation.mutate(input)
  }

  return { add, pending: mutation.isPending, added, error }
}
