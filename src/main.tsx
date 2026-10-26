import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import '@/styles/globals.css'
import { router } from '@/app/router'
import { Providers } from '@/app/Providers'
import { registerWalletProvider } from '@/services/wallet'
import { connectSocket } from '@/services/realtime/socket'

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html.')
  }

  // O worker do MSW precisa estar pronto antes do primeiro render. O import dinâmico mantém o MSW fora do bundle quando o mock está desligado.
  if (import.meta.env.VITE_API_MOCKING === 'enabled') {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()

    // Simulador de carteira: só existe com o mock ligado. Import dinâmico, como o MSW.
    const { createMockWalletProvider } = await import('@/mocks/wallet/provider')
    registerWalletProvider(createMockWalletProvider())
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )

  connectSocket()
}

void bootstrap()
