import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 09 troca pelo ProfileMenu (mobile) e redireciona para /perfil/dados no desktop.
export const Route = createFileRoute('/perfil/')({
  staticData: { title: 'Meu perfil', mobileTabBar: true },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Meu perfil</h1>,
})
