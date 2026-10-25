import { setupWorker } from 'msw/browser'

import { createMockWalletProvider } from './wallet/provider'
import { ensureSeeded } from './db/seed'
import { dropConnections, realtimeHandlers } from './realtime/server'
import { startScheduler, triggerPriceChange, triggerStockChange } from './realtime/scheduler'
import { isTestMode, mockConfig } from './scenarios/config'

// Handlers de cada recurso da API entram aqui conforme os fluxos forem implementados (um arquivo por recurso em handlers/).
const resourceHandlers: Parameters<typeof setupWorker>[0][] = []

const worker = setupWorker(...realtimeHandlers, ...resourceHandlers)

// Prefixo absoluto da API: chamada sob ele sem handler é erro (esquecer um handler fica óbvio).
const apiPrefix = new URL(mockConfig.apiBaseUrl.replace(/\/+$/, ''), window.location.origin).href

function isApiRequest(url: string): boolean {
  return url === apiPrefix || url.startsWith(`${apiPrefix}/`)
}

export interface KurioMockTestApi {
  createMockWalletProvider: typeof createMockWalletProvider
  triggerPriceChange: typeof triggerPriceChange
  triggerStockChange: typeof triggerStockChange
  dropConnections: typeof dropConnections
}

declare global {
  interface Window {
    __kurioMock?: KurioMockTestApi
  }
}

export async function startMocking(): Promise<void> {
  await ensureSeeded()

  await worker.start({
    onUnhandledRequest(request, print) {
      if (isApiRequest(request.url)) {
        print.error()
        return
      }
      // Assets e outras URLs fora da API passam direto.
    },
  })

  if (isTestMode) {
    window.__kurioMock = {
      createMockWalletProvider,
      triggerPriceChange,
      triggerStockChange,
      dropConnections,
    }
  }

  startScheduler()
}
