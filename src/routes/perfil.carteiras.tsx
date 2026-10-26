import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 10 troca pelo Wallets.
export const Route = createFileRoute('/perfil/carteiras')({
  staticData: { title: 'Carteiras' },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Carteiras</h1>,
})
