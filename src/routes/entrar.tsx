import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 05 troca pelo SignIn e troca este validateSearch pelo schema zod.
export const Route = createFileRoute('/entrar')({
  staticData: { title: 'Entrar' },
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = search.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return { redirect }
    }
    return {}
  },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Entrar</h1>,
})
