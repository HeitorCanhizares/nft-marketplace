import { createRootRouteWithContext } from '@tanstack/react-router'

import type { RouterContext } from '@/app/routerContext'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
})
