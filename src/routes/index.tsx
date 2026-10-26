import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/app/routeGuards'
import { Home } from '@/pages/Home/Home'
import { validateHomeSearch } from '@/schemas/catalog'

export const Route = createFileRoute('/')({
  staticData: { mobileTabBar: true },
  // Favoritos exige login; a Início sem `favoritos=1` continua pública.
  beforeLoad: ({ context, search, location }) =>
    search.favoritos === 1 ? requireAuth({ context, location }) : undefined,
  validateSearch: validateHomeSearch,
  // Sem `loader`: cada seção da Início carrega e mostra o próprio estado.
  component: function IndexPage() {
    return <Home search={Route.useSearch()} />
  },
})
