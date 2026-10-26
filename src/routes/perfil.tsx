import { createFileRoute, Outlet } from '@tanstack/react-router'

import { ProfileLayout } from '@/components/layout/ProfileLayout'

// Layout do perfil: menu lateral no desktop e o conteúdo da rota filha.
export const Route = createFileRoute('/perfil')({
  staticData: { footer: false },
  component: () => (
    <ProfileLayout>
      <Outlet />
    </ProfileLayout>
  ),
})
