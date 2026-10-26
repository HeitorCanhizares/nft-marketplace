import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart } from '@/hooks/queryKeys'
import { applyCartCoupon, removeCartCoupon } from '@/services/api/cart'
import { isApiError } from '@/services/http/ApiError'
import type { Cart } from '@/types/cart'

const QUOTE_ROOT = ['quote'] as const
const COUPON_KEY = ['cart-coupon'] as const

export type CartCouponError = {
  code: 'COUPON_INVALID' | 'COUPON_EXPIRED' | 'UNKNOWN'
  message: string
}

// Aplicar e remover o cupom do carrinho. Erro de cupom vai para o campo; nada é gravado no cache em erro.
export function useCartCoupon() {
  const queryClient = useQueryClient()
  const { announce } = useLiveAnnouncer()
  const [error, setError] = useState<CartCouponError | null>(null)

  function onCouponSaved(saved: Cart): void {
    queryClient.setQueryData(cart, saved)
    void queryClient.invalidateQueries({ queryKey: QUOTE_ROOT })
    setError(null)
  }

  const applyMutation = useMutation({
    mutationKey: COUPON_KEY,
    mutationFn: (code: string) => applyCartCoupon(code),
    onSuccess: (saved) => {
      onCouponSaved(saved)
      announce(`Cupom ${saved.coupon?.code ?? ''} aplicado`, 'polite')
    },
    onError: (failure) => {
      if (isApiError(failure) && failure.code === 'COUPON_INVALID') {
        setError({ code: 'COUPON_INVALID', message: 'Código promocional inválido.' })
      } else if (isApiError(failure) && failure.code === 'COUPON_EXPIRED') {
        setError({ code: 'COUPON_EXPIRED', message: 'Este código promocional expirou.' })
      } else {
        setError({
          code: 'UNKNOWN',
          message: 'Não foi possível aplicar o código. Tente de novo.',
        })
      }
    },
  })

  const removeMutation = useMutation({
    mutationKey: COUPON_KEY,
    mutationFn: () => removeCartCoupon(),
    onSuccess: (saved) => {
      onCouponSaved(saved)
      announce('Cupom removido', 'polite')
    },
    onError: () => {
      toast.error('Não foi possível remover o cupom. Tente de novo.')
    },
  })

  // Trava síncrona: um clique duplo não gera outra requisição enquanto a anterior não termina.
  function isCouponBusy(): boolean {
    return queryClient.isMutating({ mutationKey: COUPON_KEY }) > 0
  }

  function apply(code: string): void {
    if (isCouponBusy()) return
    applyMutation.mutate(code)
  }

  function remove(): void {
    if (isCouponBusy()) return
    removeMutation.mutate()
  }

  return {
    apply,
    remove,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    error,
  }
}
