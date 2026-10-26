import { createFileRoute } from '@tanstack/react-router'

import { Cart } from '@/pages/Cart/Cart'

export const Route = createFileRoute('/carrinho')({
  staticData: { title: 'Carrinho' },
  component: Cart,
})
