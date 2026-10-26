import type { ReactNode } from 'react'

import { useSignOut } from '@/hooks/useSignOut'

import { ProfileSidebar } from './ProfileSidebar'

type ProfileLayoutProps = {
  children: ReactNode
}

// Desktop: menu lateral à esquerda e conteúdo à direita. Mobile: só o conteúdo.
export function ProfileLayout({ children }: ProfileLayoutProps) {
  const signOut = useSignOut()

  return (
    <div className="container-page lg:grid lg:grid-cols-[310px_1fr] lg:items-start lg:gap-7">
      <ProfileSidebar onSignOut={signOut} className="max-lg:hidden" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
