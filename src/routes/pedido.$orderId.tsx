import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/app/routeGuards'

// Placeholder: a fase 12 troca pelo OrderConfirmation.
export const Route = createFileRoute('/pedido/$orderId')({
  staticData: { title: 'Pedido' },
  beforeLoad: requireAuth,
  component: () => <h1 className="container-page py-8 text-heading font-bold">Pedido</h1>,
})
