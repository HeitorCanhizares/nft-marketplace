export type SessionExpiredHandler = () => void

const subscribers = new Set<SessionExpiredHandler>()

export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  subscribers.add(handler)
  return () => {
    subscribers.delete(handler)
  }
}

export function emitSessionExpired(): void {
  for (const handler of [...subscribers]) {
    handler()
  }
}
