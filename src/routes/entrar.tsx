import { createFileRoute } from '@tanstack/react-router'

import { requireGuest } from '@/app/routeGuards'
import { validateAuthSearch } from '@/lib/redirect'
import { SignIn } from '@/pages/SignIn/SignIn'

export const Route = createFileRoute('/entrar')({
  staticData: { title: 'Entrar' },
  validateSearch: validateAuthSearch,
  beforeLoad: requireGuest,
  component: EntrarRoute,
})

function EntrarRoute() {
  const { redirect } = Route.useSearch()
  return <SignIn redirect={redirect} />
}
