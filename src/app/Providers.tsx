import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { clearPrivateSession } from '@/app/clearPrivateSession'
import { queryClient } from '@/app/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { LiveAnnouncerProvider } from '@/contexts/LiveAnnouncerContext'

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
          {children}
        </AuthProvider>
      </LiveAnnouncerProvider>
    </QueryClientProvider>
  )
}
