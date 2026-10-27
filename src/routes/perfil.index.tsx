import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'

import { ProfileMenuList } from '@/components/layout/ProfileMenuList'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { useAuth } from '@/contexts/auth'
import { useSignOut } from '@/hooks/useSignOut'
import { DESKTOP_MEDIA_QUERY, useIsDesktop } from '@/hooks/useMediaQuery'

// Mobile: menu em lista. Desktop: a página de dados é a principal, então vai direto para ela.
export const Route = createFileRoute('/perfil/')({
  staticData: { title: 'Meu perfil', mobileTabBar: true },
  beforeLoad: () => {
    if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
      throw redirect({ to: '/perfil/dados', replace: true })
    }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const isDesktop = useIsDesktop()
  const { user } = useAuth()
  const signOut = useSignOut()

  if (isDesktop) return <Navigate to="/perfil/dados" replace />

  return (
    <>
      <MobileTopBar title="Meu perfil" />
      {user && <ProfileMenuList user={user} onSignOut={signOut} className="pt-6" />}
    </>
  )
}
