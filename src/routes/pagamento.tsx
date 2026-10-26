import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 11 troca pelo Checkout.
export const Route = createFileRoute('/pagamento')({
  staticData: { title: 'Pagamento' },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Pagamento</h1>,
})
