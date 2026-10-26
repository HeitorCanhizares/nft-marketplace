import { http, HttpResponse, ws } from 'msw'
import { setupWorker } from 'msw/browser'

import { createMockWalletProvider } from './wallet/provider'
import { ensureSeeded } from './db/seed'
import { mergeGuestCart, userCartId } from './db/cartMerge'
import { multiplyEth, ethToUnits, unitsToEth } from './db/money'
import { hashPassword, verifyPassword } from './db/password'
import {
  cartsStore,
  favoritesStore,
  metaStore,
  nftsStore,
  ordersStore,
  reviewsStore,
  sessionsStore,
  usersStore,
  walletsStore,
} from './db/stores'
import { authHandlers } from './handlers/auth'
import { healthHandlers } from './handlers/health'
import { nftsHandlers } from './handlers/nfts'
import { dropConnections, realtimeHandlers } from './realtime/server'
import { startScheduler, triggerPriceChange, triggerStockChange } from './realtime/scheduler'
import { isTestMode, mockConfig } from './scenarios/config'

// Handlers de cada recurso da API entram aqui conforme os fluxos forem implementados (um arquivo por recurso em handlers/).
const resourceHandlers: Parameters<typeof setupWorker>[0][] = [
  ...healthHandlers,
  ...authHandlers,
  ...nftsHandlers,
]

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
  stores: {
    nftsStore: typeof nftsStore
    usersStore: typeof usersStore
    sessionsStore: typeof sessionsStore
    walletsStore: typeof walletsStore
    ordersStore: typeof ordersStore
    favoritesStore: typeof favoritesStore
    reviewsStore: typeof reviewsStore
    metaStore: typeof metaStore
    cartsStore: typeof cartsStore
  }
  password: {
    hashPassword: typeof hashPassword
    verifyPassword: typeof verifyPassword
  }
  money: {
    ethToUnits: typeof ethToUnits
    unitsToEth: typeof unitsToEth
    multiplyEth: typeof multiplyEth
  }
  cartMerge: {
    mergeGuestCart: typeof mergeGuestCart
    userCartId: typeof userCartId
  }
  msw: {
    worker: typeof worker
    http: typeof http
    HttpResponse: typeof HttpResponse
    ws: typeof ws
  }
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
      stores: {
        nftsStore,
        usersStore,
        sessionsStore,
        walletsStore,
        ordersStore,
        favoritesStore,
        reviewsStore,
        metaStore,
        cartsStore,
      },
      password: { hashPassword, verifyPassword },
      money: { ethToUnits, unitsToEth, multiplyEth },
      cartMerge: { mergeGuestCart, userCartId },
      msw: { worker, http, HttpResponse, ws },
    }
  }

  startScheduler()
}
