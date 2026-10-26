import { createContext, useContext } from 'react'

export type Politeness = 'polite' | 'assertive'

export interface LiveAnnouncerContextValue {
  announce: (message: string, politeness?: Politeness) => void
}

export const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null)

export function useLiveAnnouncer(): LiveAnnouncerContextValue {
  const context = useContext(LiveAnnouncerContext)

  if (!context) {
    throw new Error('useLiveAnnouncer deve ser usado dentro de LiveAnnouncerProvider.')
  }

  return context
}
