import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/app/routeGuards'
import { Checkout } from '@/pages/Checkout/Checkout'

export const Route = createFileRoute('/pagamento')({
  staticData: { title: 'Pagamento' },
  beforeLoad: requireAuth,
  component: Checkout,
})
