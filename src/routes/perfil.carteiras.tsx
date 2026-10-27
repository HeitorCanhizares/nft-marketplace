import { createFileRoute } from '@tanstack/react-router'

import { Wallets } from '@/pages/Wallets/Wallets'

export const Route = createFileRoute('/perfil/carteiras')({
  staticData: { title: 'Carteiras' },
  // Só aceita voltar ao Pagamento; qualquer outro valor é ignorado.
  // O parâmetro é opcional: o link de UserMenu para /perfil/carteiras não o informa.
  // Devolve sempre a chave, para o valor bruto inválido nunca chegar a useSearch().
  validateSearch: (search: Record<string, unknown>): { redirect?: '/pagamento' } => ({
    redirect: search.redirect === '/pagamento' ? '/pagamento' : undefined,
  }),
  component: WalletsRoute,
})

function WalletsRoute() {
  const { redirect } = Route.useSearch()
  return <Wallets redirect={redirect} />
}
