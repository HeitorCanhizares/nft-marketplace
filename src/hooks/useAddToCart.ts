import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { cart, nfts } from '@/hooks/queryKeys'
import { ensureGuestCartId, readSession } from '@/lib/session'
import { addCartItem } from '@/services/api/cart'
import { isApiError } from '@/services/http/ApiError'
import type { NftSummary } from '@/types/nft'

type AddVars = { nft: NftSummary; editionId: string }

const MUTATION_KEY = ['add-to-cart'] as const

function isAddVars(value: unknown): value is AddVars {
  return typeof value === 'object' && value !== null && 'nft' in value && 'editionId' in value
}

// Adiciona 1 unidade da edição de menor preço com estoque, direto do card.
export function useAddToCart() {
  const queryClient = useQueryClient()
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())

  const mutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ nft, editionId }: AddVars) =>
      addCartItem({ nftId: nft.id, editionId, quantity: 1 }),
    onSuccess: (cartData, { nft }) => {
      queryClient.setQueryData(cart, cartData)
      toast.success(`${nft.name} adicionado ao carrinho`)
    },
    onError: (error, { nft }) => {
      if (isApiError(error) && error.code === 'SOLD_OUT') {
        toast.error(`${nft.name} esgotou.`)
        void queryClient.invalidateQueries({ queryKey: nfts.lists })
      } else if (isApiError(error) && error.code === 'QUANTITY_EXCEEDS_STOCK') {
        toast.error(`Você já tem o máximo disponível de ${nft.name} no carrinho.`)
      } else {
        toast.error(`Não foi possível adicionar ${nft.name} ao carrinho. Tente de novo.`)
      }
    },
    onSettled: (_data, _error, { nft }) => {
      setPendingIds((prev) => {
        const remaining = new Set(prev)
        remaining.delete(nft.id)
        return remaining
      })
    },
  })

  function add(nft: NftSummary): void {
    const editionId = nft.defaultEditionId
    if (!editionId || nft.soldOut) return

    // O cache de mutações já sabe, de forma síncrona, que há um pedido em andamento para este NFT
    // (o state `pendingIds` só muda no render seguinte, e dois cliques no mesmo render passariam).
    const inFlight = queryClient.isMutating({
      mutationKey: MUTATION_KEY,
      predicate: (candidate) => {
        const vars = candidate.state.variables
        return isAddVars(vars) && vars.nft.id === nft.id
      },
    })
    if (inFlight > 0) return

    // Visitante sem sessão: o carrinho é identificado pelo X-Cart-Id, criado aqui se ainda não existe.
    if (readSession() === null) ensureGuestCartId()

    setPendingIds((prev) => new Set(prev).add(nft.id))
    mutation.mutate({ nft, editionId })
  }

  return { add, pendingIds }
}
