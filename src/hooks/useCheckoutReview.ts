import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cart, orders, quoteAll } from '@/hooks/queryKeys'
import { useCheckoutSubmit } from '@/hooks/useCheckoutSubmit'
import type { CheckoutCollected, useCheckoutForm } from '@/hooks/useCheckoutForm'
import type { useCheckoutWallet } from '@/hooks/useCheckoutWallet'
import { useWalletMutations } from '@/hooks/useWallets'
import { diffQuotes, type QuoteChangeEntry } from '@/lib/quoteDiff'
import { networkLabel } from '@/lib/walletOptions'
import { removeCartItem } from '@/services/api/cart'
import type { Quote } from '@/types/cart'
import type { User } from '@/types/user'

type CheckoutForm = ReturnType<typeof useCheckoutForm>
type CheckoutWallet = ReturnType<typeof useCheckoutWallet>

type Review = { quote: Quote; changes: QuoteChangeEntry[] }

export type UseCheckoutReviewInput = {
  user: User
  form: CheckoutForm
  wallet: CheckoutWallet
  quote: Quote | undefined
  refreshQuote: () => Promise<Quote>
}

const WALLET_LOST_MESSAGE = 'Carteira desconectada. Conecte novamente.'

// Confirmar compra → revalidação da cotação → revisão → confirmar e pagar, com pedido criado ao final.
export function useCheckoutReview({
  user,
  form,
  wallet,
  quote,
  refreshQuote,
}: UseCheckoutReviewInput) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { announce } = useLiveAnnouncer()
  const { saveSecondary } = useWalletMutations()
  const { submit, phase } = useCheckoutSubmit()

  const [review, setReview] = useState<Review | null>(null)
  const [collected, setCollected] = useState<CheckoutCollected | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Trava de clique repetido em confirmPurchase, lida só dentro do handler.
  const checkingRef = useRef(false)

  function announceBlock(message: string) {
    setBlockMessage(message)
    announce(message, 'assertive')
  }

  async function confirmPurchase(): Promise<void> {
    if (checkingRef.current) return
    checkingRef.current = true
    setIsChecking(true)

    try {
      setBlockMessage(null)
      const result = await form.collect()
      setCollected(result)
      if (result === null) return

      if (wallet.connection.status !== 'connected') {
        announceBlock('Conecte uma carteira para continuar.')
        return
      }

      const expected = form.network
      if (wallet.isMismatch && expected !== null) {
        announceBlock(`Troque para a rede ${networkLabel(expected)} na carteira.`)
        return
      }

      let fresh: Quote
      try {
        fresh = await refreshQuote()
      } catch {
        setBlockMessage('Não foi possível conferir os valores. Tente novamente.')
        return
      }

      const changes = quote ? diffQuotes(quote, fresh) : []
      setReview({ quote: fresh, changes })
      announce(
        changes.length > 0 ? 'Os valores mudaram. Confirme de novo.' : 'Revise o pedido',
        'polite',
      )
    } finally {
      checkingRef.current = false
      setIsChecking(false)
    }
  }

  async function pay(): Promise<void> {
    if (review === null || collected === null || phase !== 'idle') return

    if (!wallet.isReady) {
      setError(WALLET_LOST_MESSAGE)
      return
    }

    const { network } = form
    const { provider, connection } = wallet
    if (network === null || provider === null || connection.address === null) {
      setError(WALLET_LOST_MESSAGE)
      return
    }

    setError(null)
    const current = review

    if (collected.secondaryBody !== undefined) {
      try {
        await saveSecondary(collected.secondaryBody)
      } catch {
        setError('Não foi possível salvar a carteira secundária. O pedido não foi enviado.')
        return
      }
    }

    const result = await submit({
      userId: user.id,
      quote: current.quote,
      request: {
        collector: collected.collector,
        walletId: collected.walletId,
        network,
        provider,
        walletAddress: connection.address,
        note: collected.note,
      },
    })

    switch (result.kind) {
      case 'created':
        form.discardDraft()
        void queryClient.invalidateQueries({ queryKey: orders.pending })
        void navigate({
          to: '/pedido/$orderId',
          params: { orderId: result.order.id },
          replace: true,
        })
        return

      case 'changed':
        setReview({ quote: result.quote, changes: diffQuotes(current.quote, result.quote) })
        setError(null)
        void queryClient.invalidateQueries({ queryKey: quoteAll })
        announce('Os valores mudaram. Confirme de novo.', 'polite')
        return

      case 'stale':
        try {
          const fresh = await refreshQuote()
          setReview({ quote: fresh, changes: diffQuotes(current.quote, fresh) })
          setError('A cotação expirou. Conferimos os valores novamente.')
        } catch {
          setError('Não foi possível conferir os valores. Tente novamente.')
        }
        return

      case 'cancelled':
      case 'failed':
        setError(result.message)
        return
    }
  }

  async function removeSoldOut(itemId: string): Promise<void> {
    if (review === null || removingId !== null) return
    const current = review

    setRemovingId(itemId)
    try {
      await removeCartItem(itemId)
      void queryClient.invalidateQueries({ queryKey: cart })

      const fresh = await refreshQuote()
      if (fresh.items.length === 0) {
        setReview(null)
        void navigate({ to: '/carrinho', replace: true })
        return
      }
      setReview({ quote: fresh, changes: diffQuotes(current.quote, fresh) })
    } catch {
      setError('Não foi possível remover o item. Tente de novo.')
    } finally {
      setRemovingId(null)
    }
  }

  function closeReview() {
    setReview(null)
    setError(null)
  }

  const reviewBlockMessage = review !== null && !wallet.isReady ? WALLET_LOST_MESSAGE : null

  return {
    confirmPurchase,
    isChecking,
    blockMessage,
    review: {
      open: review !== null,
      quote: review?.quote,
      changes: review?.changes ?? [],
      error,
      phase,
      removingId,
      canPay: wallet.isReady && phase === 'idle',
      blockMessage: reviewBlockMessage,
    },
    pay,
    closeReview,
    removeSoldOut,
    collected,
  }
}
