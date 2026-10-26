import { createRouter } from '@tanstack/react-router'

import { RouteError, RouteNotFound, RoutePending } from '@/components/layout/RouteFallbacks'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: RouteNotFound,
  defaultErrorComponent: RouteError,
  defaultPendingComponent: RoutePending,
  // Voltar/avançar do navegador restaura a rolagem (pergunta 14 aprovada).
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface StaticDataRouteOption {
    title?: string // título do documento: "<title> | Kurio"; sem título, só "Kurio"
    footer?: boolean // padrão true (só desktop)
    mobileTabBar?: boolean // padrão false
  }
}
