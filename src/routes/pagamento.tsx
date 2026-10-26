import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/app/routeGuards'

// Placeholder: a fase 11 troca pelo Checkout.
export const Route = createFileRoute('/pagamento')({
  staticData: { title: 'Pagamento' },
  beforeLoad: requireAuth,
  component: () => <h1 className="container-page py-8 text-heading font-bold">Pagamento</h1>,
})
