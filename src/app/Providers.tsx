import { lazy, Suspense, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { clearPrivateSession } from '@/app/clearPrivateSession'
import { queryClient } from '@/app/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { LiveAnnouncerProvider } from '@/contexts/LiveAnnouncerContext'

// Ponte de teste: o ramo e o import somem do build de produção (MODE !== 'test').
const isTest = import.meta.env.MODE === 'test'
const TestBridge = isTest ? lazy(() => import('@/app/TestBridge')) : null

type ProvidersProps = {
  children: ReactNode
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
