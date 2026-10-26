import { useEffect, useRef } from 'react'
import { RouterProvider } from '@tanstack/react-router'

import { router } from '@/app/router'
import { useAuth } from '@/contexts/auth'

// Entrega o AuthContext ao roteador e reavalia as guardas quando o status muda (login, logout, expiração, fim da recuperação).
export function AppRouter() {
  const auth = useAuth()
  const previousStatus = useRef(auth.status)

  useEffect(() => {
    // Na montagem o roteador já carrega sozinho; só invalida quando o status realmente muda.
    if (previousStatus.current === auth.status) return
    previousStatus.current = auth.status
    void router.invalidate()
  }, [auth.status])

  return <RouterProvider router={router} context={{ auth }} />
}
