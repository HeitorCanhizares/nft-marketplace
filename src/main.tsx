import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import '@/styles/globals.css'
import { router } from '@/app/router'

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no index.html.')
  }

  // O worker do MSW precisa estar pronto antes do primeiro render. O import dinâmico mantém o MSW fora do bundle quando o mock está desligado.
  if (import.meta.env.VITE_API_MOCKING === 'enabled') {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

void bootstrap()
