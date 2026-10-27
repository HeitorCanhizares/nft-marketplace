import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useProfile } from '@/hooks/useProfile'
import { ProfileForm } from '@/pages/Profile/ProfileForm'
import { ProfileSkeleton } from '@/pages/Profile/ProfileSkeleton'

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
      {/* No desktop o título visível é o "Perfil do colecionador" do formulário. */}
      <PageHeader title="Dados do perfil" isDesktop={isDesktop} backTo={{ to: '/perfil' }} />
      <div className="flex flex-col px-7 pb-8 lg:px-0">{content}</div>
    </>
  )
}
