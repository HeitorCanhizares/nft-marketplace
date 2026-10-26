import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
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
