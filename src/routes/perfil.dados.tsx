import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 09 troca pelo Profile.
export const Route = createFileRoute('/perfil/dados')({
  staticData: { title: 'Dados do perfil' },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Dados do perfil</h1>,
})
