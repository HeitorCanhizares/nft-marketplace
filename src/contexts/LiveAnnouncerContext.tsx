import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { LiveRegion } from '@/components/shared/LiveRegion'
import {
  LiveAnnouncerContext,
  type LiveAnnouncerContextValue,
  type Politeness,
} from '@/contexts/liveAnnouncer'

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const frames = useRef<Record<Politeness, number | null>>({ polite: null, assertive: null })

  const announce = useCallback<LiveAnnouncerContextValue['announce']>(
    (message, politeness = 'polite') => {
      const setMessage = politeness === 'assertive' ? setAssertiveMessage : setPoliteMessage

      // Limpa a região e escreve a mensagem no quadro seguinte, para que o leitor de tela
      // anuncie de novo mesmo quando a mensagem é igual à anterior.
      setMessage('')

      const pending = frames.current[politeness]
      if (pending !== null) {
        cancelAnimationFrame(pending)
      }

      frames.current[politeness] = requestAnimationFrame(() => {
        frames.current[politeness] = null
        setMessage(message)
      })
    },
    [],
  )

  useEffect(() => {
    const pendingFrames = frames.current

    return () => {
      for (const frame of Object.values(pendingFrames)) {
        if (frame !== null) {
          cancelAnimationFrame(frame)
        }
      }
    }
  }, [])

  const value = useMemo<LiveAnnouncerContextValue>(() => ({ announce }), [announce])

  return (
    <LiveAnnouncerContext.Provider value={value}>
      {children}
      <LiveRegion politeness="polite" message={politeMessage} />
      <LiveRegion politeness="assertive" message={assertiveMessage} />
    </LiveAnnouncerContext.Provider>
  )
}
