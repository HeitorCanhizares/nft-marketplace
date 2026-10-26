import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import { registerWalletProvider } from '@/services/wallet'

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html.')
  }

  // Ordem obrigatória: o MSW precisa trocar o WebSocket nativo ANTES de qualquer módulo do app
  // ser avaliado. socket.io-client (engine.io-client) captura globalThis.WebSocket na avaliação,
  // então todo o app (e o socket) entra por import() depois de startMocking().
  if (import.meta.env.VITE_API_MOCKING === 'enabled') {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()

    // Simulador de carteira: só existe com o mock ligado.
    const { createMockWalletProvider } = await import('@/mocks/wallet/provider')
    registerWalletProvider(createMockWalletProvider())
  }

  const [{ Providers }, { RouterProvider }, { router }, { connectSocket }] = await Promise.all([
    import('@/app/Providers'),
    import('@tanstack/react-router'),
    import('@/app/router'),
    import('@/services/realtime/socket'),
  ])

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
