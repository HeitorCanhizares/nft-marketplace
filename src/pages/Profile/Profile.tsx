import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { ErrorState } from '@/components/shared/ErrorState'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useProfile } from '@/hooks/useProfile'
import { ProfileForm } from '@/pages/Profile/ProfileForm'
import { ProfileSkeleton } from '@/pages/Profile/ProfileSkeleton'

// Cabeçalho por viewport: no desktop o título visível é o "Perfil do colecionador" do formulário.
function PageHeader({ isDesktop }: { isDesktop: boolean }) {
  if (!isDesktop) return <MobileTopBar title="Dados do perfil" backTo={{ to: '/perfil' }} />

  return <h1 className="sr-only">Dados do perfil</h1>
}

// Página de dados do perfil: liga a consulta às telas (carregando, erro e formulário).
export function Profile() {
  const isDesktop = useIsDesktop()
  const profileQuery = useProfile()
  const user = profileQuery.data

  let content
  if (user !== undefined) {
    content = <ProfileForm user={user} />
  } else if (profileQuery.isError) {
    content = (
      <ErrorState
        as="h2"
        onRetry={() => {
          void profileQuery.refetch()
        }}
        retrying={profileQuery.isFetching}
      />
    )
  } else {
    content = <ProfileSkeleton />
  }

  return (
    <>
      <PageHeader isDesktop={isDesktop} />
      <div className="flex flex-col px-7 pb-8 lg:px-0">{content}</div>
    </>
  )
}
