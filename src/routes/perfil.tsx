import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireAuth } from '@/app/routeGuards'
import { ProfileLayout } from '@/components/layout/ProfileLayout'

// Layout do perfil: menu lateral no desktop e o conteúdo da rota filha.
export const Route = createFileRoute('/perfil')({
  staticData: { footer: false },
  beforeLoad: requireAuth,
  component: () => (
    <ProfileLayout>
      <Outlet />
    </ProfileLayout>
  ),
})
