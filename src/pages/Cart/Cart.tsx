import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import type { BreadcrumbEntry } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth'
import { useCart } from '@/hooks/useCart'
import { useCartCoupon } from '@/hooks/useCartCoupon'
import { useCartItemActions } from '@/hooks/useCartItemActions'
import { useCartLive } from '@/hooks/useCartLive'
import { useCartQuote } from '@/hooks/useCartQuote'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { checkoutTarget, getCheckoutState } from '@/lib/cartCheckout'
import { CartDesktop } from '@/pages/Cart/CartDesktop'
import { CartMobile } from '@/pages/Cart/CartMobile'
import { CartSkeleton } from '@/pages/Cart/CartSkeleton'
import type { CartLineActions, CartSummaryProps, CartViewProps } from '@/pages/Cart/viewProps'
import type { PriceChange } from '@/components/shared/LineItem'
import type { CartItem } from '@/types/cart'

const TITLE = 'Carrinho de NFTs'

const BREADCRUMB: BreadcrumbEntry[] = [
  { label: 'Início', link: { to: '/' } },
  { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
  { label: 'Carrinho' },
]

// Página do carrinho: liga os hooks às telas e trata carregando, erro, vazio e o foco ao remover.
export function Cart() {
  const isDesktop = useIsDesktop()
  const { status } = useAuth()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const cartData = cartQuery.data

  const quoteState = useCartQuote(cartData)
  const { setQuantity, remove, adjust, pendingIds } = useCartItemActions()
  const coupon = useCartCoupon()
  useCartLive(cartData)

  // Foco depois de remover: a lixeira que ocupa o mesmo lugar, ou o título do vazio.
  const pageRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)

  const items = cartData?.items ?? []

  // Ao remover o último item, o foco vai para o título do estado vazio assim que ele aparece.
  const focusEmptyRef = useRef(false)
  const isEmpty = cartData !== undefined && items.length === 0
  useEffect(() => {
    if (!isEmpty || !focusEmptyRef.current) return
    focusEmptyRef.current = false
    const heading = emptyRef.current?.querySelector<HTMLElement>('h2')
    if (heading) {
      heading.tabIndex = -1
      heading.focus()
    }
  }, [isEmpty])

  // Ao remover uma linha (não a última), foca a lixeira que ficou no lugar depois que a linha sai do DOM.
  const focusIndexRef = useRef<number | null>(null)
  const itemCount = items.length
  useEffect(() => {
    const index = focusIndexRef.current
    if (index === null) return
    focusIndexRef.current = null
    const buttons = pageRef.current?.querySelectorAll<HTMLElement>('[data-remove-for]') ?? []
    buttons[Math.min(index, buttons.length - 1)]?.focus()
  }, [itemCount])
  // Desktop: container da largura da página. Mobile: a largura toda, com o respiro dos blocos.
  const frameClass = isDesktop ? 'container-page flex flex-col pb-16' : 'flex flex-col pb-8'

  const priceChanges = useMemo(() => {
    const changes = new Map<string, PriceChange>()
    for (const line of quoteState.quote?.items ?? []) {
      if (line.priceChanged !== undefined) changes.set(line.id, line.priceChanged)
    }
    return changes
  }, [quoteState.quote])

  if (cartData === undefined) {
    return (
      <div ref={pageRef} className={frameClass}>
        <PageHeader title={TITLE} isDesktop={isDesktop} breadcrumb={BREADCRUMB} />
        {cartQuery.isError ? (
          <ErrorState
            onRetry={() => {
              void cartQuery.refetch()
            }}
            retrying={cartQuery.isFetching}
          />
        ) : (
          <CartSkeleton variant={isDesktop ? 'desktop' : 'mobile'} />
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div ref={pageRef} className={frameClass}>
        <PageHeader title={TITLE} isDesktop={isDesktop} breadcrumb={BREADCRUMB} />
        <div ref={emptyRef}>
          <EmptyState
            as="h2"
            title="Seu carrinho está vazio"
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar NFTs
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  // Remover: guarda o índice e tira a linha; o efeito acima foca a lixeira que ficou no lugar.
  function handleRemove(item: CartItem): void {
    const index = items.findIndex((line) => line.id === item.id)
    if (items.length === 1) {
      focusEmptyRef.current = true
    } else if (index !== -1) {
      focusIndexRef.current = index
    }
    remove(item)
  }

  function handleCheckout(): void {
    void navigate(checkoutTarget(status === 'authenticated'))
  }

  const checkoutState = getCheckoutState(items)
  const couponStatus = quoteState.quote?.coupon?.status

  const actions: CartLineActions = {
    onQuantityChange: setQuantity,
    onRemove: handleRemove,
    onAdjust: adjust,
  }

  const summary: CartSummaryProps = {
    coupon:
      cartData.coupon === undefined
        ? undefined
        : {
            code: cartData.coupon.code,
            status: couponStatus === 'expired' ? 'expired' : 'applied',
            message: couponStatus === 'expired' ? quoteState.quote?.coupon?.message : undefined,
          },
    onApply: coupon.apply,
    onRemove: coupon.remove,
    isApplying: coupon.isApplying,
    isRemoving: coupon.isRemoving,
    couponError: coupon.error,
    quote: quoteState.quote,
    isUpdating: quoteState.isUpdating || pendingIds.size > 0,
    isQuoteError: quoteState.isError,
    onRetryQuote: () => {
      void quoteState.refetch()
    },
    checkout: {
      canCheckout: checkoutState.canCheckout,
      reason: checkoutState.reason,
      onCheckout: handleCheckout,
    },
  }

  const viewProps: CartViewProps = {
    items,
    priceChanges,
    busyIds: pendingIds,
    actions,
    summary,
  }

  return (
    <div ref={pageRef}>
      {isDesktop ? <CartDesktop {...viewProps} /> : <CartMobile {...viewProps} />}
    </div>
  )
}
