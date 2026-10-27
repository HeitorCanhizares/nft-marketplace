import { useSyncExternalStore } from 'react'
import { isSocketConnected, onSocketConnection } from '@/services/realtime/socket'

// true enquanto o socket estiver conectado; re-renderiza a cada troca de estado.
export function useSocketConnected(): boolean {
  return useSyncExternalStore(
    (notify) =>
      onSocketConnection(() => {
        notify()
      }),
    isSocketConnected,
  )
}
