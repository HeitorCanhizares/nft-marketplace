import { useNavigate } from '@tanstack/react-router'

import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { CheckoutReview } from '@/components/shared/CheckoutReview'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAuth } from '@/contexts/auth'
import { useCartCoupon } from '@/hooks/useCartCoupon'
import { useCartLive } from '@/hooks/useCartLive'
import { useCheckoutEntry } from '@/hooks/useCheckoutEntry'
import { useCheckoutForm } from '@/hooks/useCheckoutForm'
import { useCheckoutQuote } from '@/hooks/useCheckoutQuote'
import { useCheckoutReview } from '@/hooks/useCheckoutReview'
import { useCheckoutWallet } from '@/hooks/useCheckoutWallet'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useWallets } from '@/hooks/useWallets'
import type { Cart } from '@/types/cart'
import type { User, WalletsResponse } from '@/types/user'

import { CheckoutDesktop } from './CheckoutDesktop'
import { CheckoutMobile } from './CheckoutMobile'
import { CheckoutSkeleton } from './CheckoutSkeleton'
import type { CheckoutViewProps } from './viewProps'

const TITLE = 'Pagamento com carteira'

type CheckoutContentProps = {
  cart: Cart
  wallets: WalletsResponse
  user: User
  isDesktop: boolean
}

// Os hooks do formulário só montam com os dados, para não chamar hooks de forma condicional.
function CheckoutContent({ cart, wallets, user, isDesktop }: CheckoutContentProps) {
  const navigate = useNavigate()

  const form = useCheckoutForm(wallets, user)
  const quoteState = useCheckoutQuote(cart, form.network)

  // Mesma regra do mobile: com carteira salva escolhida, a rede é a dela; no manual, a do formulário.
  const selectedWallet =
    form.mode === 'secondary' ? wallets.secondary : form.mode === 'primary' ? wallets.primary : null
  const expectedNetwork =
    form.mode === 'primary' || form.mode === 'secondary'
      ? (selectedWallet?.network ?? null)
      : form.network

  const wallet = useCheckoutWallet(expectedNetwork, form.provider, form.setProvider)
  const review = useCheckoutReview({
    user,
    form,
    wallet,
    quote: quoteState.quote,
    refreshQuote: quoteState.refresh,
  })
  const coupon = useCartCoupon()
  useCartLive(cart)

  const couponStatus = quoteState.quote?.coupon?.status

  const viewProps: CheckoutViewProps = {
    items: cart.items,
    form,
    wallet,
    quote: {
      quote: quoteState.quote,
      isUpdating: quoteState.isUpdating,
      isError: quoteState.isError,
      onRetry: () => {
        void quoteState.refetch()
      },
    },
    coupon: {
      coupon:
        cart.coupon === undefined
          ? undefined
          : {
              code: cart.coupon.code,
              status: couponStatus === 'expired' ? 'expired' : 'applied',
              message: couponStatus === 'expired' ? quoteState.quote?.coupon?.message : undefined,
            },
      onApply: coupon.apply,
      onRemove: coupon.remove,
      isApplying: coupon.isApplying,
      isRemoving: coupon.isRemoving,
      couponError: coupon.error,
    },
    confirm: {
      onConfirm: review.confirmPurchase,
      isChecking: review.isChecking,
      message: review.blockMessage ?? form.noteError,
    },
    onEditWallet: () => {
      void navigate({ to: '/perfil/carteiras', search: { redirect: '/pagamento' } })
    },
  }

  const reviewView = review.review

  return (
    <>
      {isDesktop ? (
        <CheckoutDesktop {...viewProps} />
      ) : (
        <CheckoutMobile
          {...viewProps}
          primaryWallet={wallets.primary}
          secondaryWallet={wallets.secondary}
        />
      )}

      <CheckoutReview
        open={reviewView.open}
        quote={reviewView.quote ?? null}
        changes={reviewView.changes}
        collectorName={review.collected?.collector.displayName ?? ''}
        collectorAddress={review.collected?.collector.address ?? ''}
        provider={wallet.provider}
        walletAddress={wallet.connection.address}
        network={form.network}
        phase={reviewView.phase}
        error={reviewView.error}
        canPay={reviewView.canPay}
        blockMessage={reviewView.blockMessage}
        removingId={reviewView.removingId}
        onReconnect={wallet.reconnect}
        onPay={review.pay}
        onBack={review.closeReview}
        onRemoveItem={review.removeSoldOut}
      />
    </>
  )
}

// Página do pagamento: liga a entrada, as carteiras e a revisão às telas; trata carregando e erro.
export function Checkout() {
  const isDesktop = useIsDesktop()
  const { user } = useAuth()
  const entry = useCheckoutEntry()
  const walletsQuery = useWallets()
  const wallets = walletsQuery.data

  if (entry.isCartError || walletsQuery.isError) {
    const retry = () => {
      entry.retryCart()
      void walletsQuery.refetch()
    }

    return (
      <div className={isDesktop ? 'container-page flex flex-col pb-16' : 'flex flex-col pb-8'}>
        {isDesktop ? (
          <h1 className="sr-only">Pagamento</h1>
        ) : (
          <MobileTopBar title={TITLE} backTo={{ to: '/carrinho' }} />
        )}
        <ErrorState onRetry={retry} retrying={walletsQuery.isFetching} />
      </div>
    )
  }

  if (entry.status === 'checking' || entry.cart === undefined || wallets === undefined || !user) {
    return <CheckoutSkeleton variant={isDesktop ? 'desktop' : 'mobile'} />
  }

  return <CheckoutContent cart={entry.cart} wallets={wallets} user={user} isDesktop={isDesktop} />
}
