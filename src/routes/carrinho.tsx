import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 08 troca pelo Cart.
export const Route = createFileRoute('/carrinho')({
  staticData: { title: 'Carrinho' },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Carrinho</h1>,
})
