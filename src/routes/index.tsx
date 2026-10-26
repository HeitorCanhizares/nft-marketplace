import { createFileRoute } from '@tanstack/react-router'

// Placeholder: a fase 06 troca pelo Home.
export const Route = createFileRoute('/')({
  staticData: { mobileTabBar: true },
  // Placeholder: a fase 06 troca este validateSearch pelo schema zod completo de rotas.md.
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; colecao?: string; favoritos?: 1 } => {
    const result: { q?: string; colecao?: string; favoritos?: 1 } = {}
    if (typeof search.q === 'string' && search.q.trim() !== '') {
      result.q = search.q.trim()
    }
    if (typeof search.colecao === 'string' && search.colecao !== '') {
      result.colecao = search.colecao
    }
    if (search.favoritos === 1 || search.favoritos === '1') {
      result.favoritos = 1
    }
    return result
  },
  component: () => <h1>Kurio</h1>,
})
