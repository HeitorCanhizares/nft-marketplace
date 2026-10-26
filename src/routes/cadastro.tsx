import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 05 troca pelo SignUp e troca este validateSearch pelo schema zod.
export const Route = createFileRoute('/cadastro')({
  staticData: { title: 'Criar conta' },
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = search.redirect
    // `redirect: undefined` explícito: o roteador mescla o resultado sobre a busca bruta, então `{}` deixaria `//host` vazar para useSearch.
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return { redirect }
    }
    return { redirect: undefined }
  },
  component: () => <h1 className="container-page py-8 text-heading font-bold">Criar conta</h1>,
})
