import type { CartSummaryPanelProps } from '@/components/shared/CartSummaryPanel'
import type { useCheckoutForm } from '@/hooks/useCheckoutForm'
import type { useCheckoutWallet } from '@/hooks/useCheckoutWallet'
import type { Quote, CartItem } from '@/types/cart'

export type CheckoutFormApi = ReturnType<typeof useCheckoutForm>
export type CheckoutWalletApi = ReturnType<typeof useCheckoutWallet>
export type CheckoutQuoteView = {
  quote: Quote | undefined
  isUpdating: boolean
  isError: boolean
  onRetry: () => void
}
export type CheckoutCouponView = Pick<
  CartSummaryPanelProps,
  'coupon' | 'onApply' | 'onRemove' | 'isApplying' | 'isRemoving' | 'couponError'
>
export type CheckoutConfirmView = {
  onConfirm: () => void
  isChecking: boolean
  message: string | null
}
export type CheckoutViewProps = {
  items: CartItem[]
  form: CheckoutFormApi
  wallet: CheckoutWalletApi
  quote: CheckoutQuoteView
  coupon: CheckoutCouponView
  confirm: CheckoutConfirmView
  onEditWallet: () => void // mobile: "Editar carteira" do menu "⋮"
}
