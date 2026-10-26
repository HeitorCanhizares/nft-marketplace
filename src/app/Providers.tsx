import { lazy, Suspense, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { clearPrivateSession } from '@/app/clearPrivateSession'
import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { AuthProvider } from '@/contexts/AuthContext'
import { LiveAnnouncerProvider } from '@/contexts/LiveAnnouncerContext'

// Ponte de teste: o ramo e o import somem do build de produção (MODE !== 'test').
const isTest = import.meta.env.MODE === 'test'
const TestBridge = isTest ? lazy(() => import('@/app/TestBridge')) : null

type ProvidersProps = {
  children: ReactNode
}

// Expiração: avisa e leva ao login, voltando depois ao mesmo ponto. A guarda de rota também
// redireciona ao virar anônimo; os dois caminhos vão ao mesmo destino com `replace`.
function handleSessionExpired(): void {
  toast('Sua sessão expirou. Entre novamente para continuar.')

  const { pathname, href } = router.state.location
  if (pathname === '/entrar' || pathname === '/cadastro') return

  void router.navigate({ to: '/entrar', search: { redirect: href }, replace: true })
}

// Ordem: Query → LiveAnnouncer → Auth. O AuthProvider usa o anunciador.
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveAnnouncerProvider>
        <AuthProvider
          onClearPrivateSession={() => {
            void clearPrivateSession(queryClient)
          }}
          onExpired={handleSessionExpired}
        >
          {TestBridge && (
            <Suspense fallback={null}>
              <TestBridge />
            </Suspense>
          )}
          {children}
        </AuthProvider>
      </LiveAnnouncerProvider>
    </QueryClientProvider>
  )
}
