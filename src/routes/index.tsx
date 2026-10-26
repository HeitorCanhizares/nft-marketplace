import { createFileRoute } from '@tanstack/react-router'

import { Home } from '@/pages/Home/Home'

// Placeholder: a fase 06 troca pelo Home.
export const Route = createFileRoute('/')({
  staticData: { mobileTabBar: true },
  // Placeholder: a fase 06 troca este validateSearch pelo schema zod completo de rotas.md.
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; colecao?: string; favoritos?: 1 } => {
    // Chaves ausentes ficam `undefined` explícitas: o roteador mescla o resultado sobre a busca bruta, então omiti-las deixaria o valor inválido vazar para useSearch.
    const q = typeof search.q === 'string' ? search.q.trim() : ''
    const colecao = typeof search.colecao === 'string' ? search.colecao : ''
    return {
      q: q !== '' ? q : undefined,
      colecao: colecao !== '' ? colecao : undefined,
      favoritos: search.favoritos === 1 || search.favoritos === '1' ? 1 : undefined,
    }
  },
  component: Home,
})
