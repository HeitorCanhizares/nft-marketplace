import type { AuthSearch } from '@/lib/redirect'
import type { CartItem } from '@/types/cart'

export type CheckoutState = {
  canCheckout: boolean
  reason: string | null
  blockedIds: string[]
}

export type CheckoutTarget = { to: '/pagamento' } | { to: '/entrar'; search: AuthSearch }

// Pode fechar o pedido? Ordem de prioridade: vazio, esgotado, estoque. Não olha preço nem cotação.
export function getCheckoutState(items: readonly CartItem[]): CheckoutState {
  if (items.length === 0) {
    return { canCheckout: false, reason: 'Seu carrinho está vazio.', blockedIds: [] }
  }

  const soldOut = items.filter((item) => item.availability === 'sold_out').map((item) => item.id)
  if (soldOut.length > 0) {
    return {
      canCheckout: false,
      reason: 'Remova os itens esgotados para continuar.',
      blockedIds: soldOut,
    }
  }

  const insufficient = items
    .filter((item) => item.availability === 'insufficient')
    .map((item) => item.id)
  if (insufficient.length > 0) {
    return {
      canCheckout: false,
      reason: 'Ajuste as quantidades acima do estoque para continuar.',
      blockedIds: insufficient,
    }
  }

  return { canCheckout: true, reason: null, blockedIds: [] }
}

// Visitante vai para o login e volta ao pagamento; logado segue direto.
export function checkoutTarget(isAuthenticated: boolean): CheckoutTarget {
  if (isAuthenticated) return { to: '/pagamento' }
  return { to: '/entrar', search: { redirect: '/pagamento' } }
}
