import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 12 troca pelo OrderConfirmation.
export const Route = createFileRoute('/pedido/$orderId')({
  staticData: { title: 'Pedido' },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Pedido</h1>,
})
