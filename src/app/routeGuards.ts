import { redirect } from '@tanstack/react-router'

import type { RouterContext } from '@/app/routerContext'
import type { AuthContextValue } from '@/contexts/auth'
import { parseRedirect } from '@/lib/redirect'

type SettledStatus = 'authenticated' | 'anonymous'

// Com a sessão ainda sendo recuperada (`loading`), espera `ready` em vez de adivinhar.
async function settledStatus(auth: AuthContextValue): Promise<SettledStatus> {
  return auth.status === 'loading' ? await auth.ready : auth.status
}

// Rota só para logado. O AppRouter chama router.invalidate() quando o status muda, então estas funções rodam de novo depois do login, do logout e da expiração.
export async function requireAuth({
  context,
  location,
}: {
  context: RouterContext
  location: { href: string }
}): Promise<void> {
  if ((await settledStatus(context.auth)) !== 'authenticated') {
    throw redirect({
      to: '/entrar',
      search: { redirect: parseRedirect(location.href) },
      replace: true,
    })
  }
}

// Rota só para deslogado. Com sessão, vai para o destino seguro do `redirect` ou para `/`.
export async function requireGuest({
  context,
  search,
}: {
  context: RouterContext
  search: { redirect?: string }
}): Promise<void> {
  if ((await settledStatus(context.auth)) === 'authenticated') {
    throw redirect({ href: parseRedirect(search.redirect) ?? '/', replace: true })
  }
}
