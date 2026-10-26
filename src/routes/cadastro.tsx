import { createFileRoute } from '@tanstack/react-router'

import { requireGuest } from '@/app/routeGuards'
import { validateAuthSearch } from '@/lib/redirect'
import { SignUp } from '@/pages/SignUp/SignUp'

export const Route = createFileRoute('/cadastro')({
  staticData: { title: 'Criar conta' },
  validateSearch: validateAuthSearch,
  beforeLoad: requireGuest,
  component: CadastroRoute,
})

function CadastroRoute() {
  const { redirect } = Route.useSearch()
  return <SignUp redirect={redirect} />
}
