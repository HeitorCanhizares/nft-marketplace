import { createFileRoute } from '@tanstack/react-router'

import { Wallets } from '@/pages/Wallets/Wallets'

export const Route = createFileRoute('/perfil/carteiras')({
  staticData: { title: 'Carteiras' },
  // Só aceita voltar ao Pagamento; qualquer outro valor é ignorado.
  // O parâmetro é opcional: o link de UserMenu para /perfil/carteiras não o informa.
  validateSearch: (search: Record<string, unknown>): { redirect?: '/pagamento' } =>
    search.redirect === '/pagamento' ? { redirect: '/pagamento' } : {},
  component: WalletsRoute,
})

function WalletsRoute() {
  const { redirect } = Route.useSearch()
  return <Wallets redirect={redirect} />
}
