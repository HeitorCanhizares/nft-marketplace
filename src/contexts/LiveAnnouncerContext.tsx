import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

import { LiveRegion } from '@/components/shared/LiveRegion'
import {
  LiveAnnouncerContext,
  type LiveAnnouncerContextValue,
  type Politeness,
} from '@/contexts/liveAnnouncer'

interface Announcement {
  message: string
  id: number
}

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState<Announcement>({ message: '', id: 0 })
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<Announcement>({
    message: '',
    id: 0,
  })
  const counters = useRef<Record<Politeness, number>>({ polite: 0, assertive: 0 })

  // Cada anúncio gera um id novo, que vira a key do nó na região. Assim, a mesma mensagem
  // anunciada de novo insere um nó novo no DOM e o leitor de tela a relê.
  // flushSync garante um commit por chamada, então duas chamadas seguidas viram duas inserções.
  const announce = useCallback<LiveAnnouncerContextValue['announce']>(
    (message, politeness = 'polite') => {
      counters.current[politeness] += 1
      const announcement = { message, id: counters.current[politeness] }

      if (politeness === 'assertive') {
        flushSync(() => setAssertiveAnnouncement(announcement))
      } else {
        flushSync(() => setPoliteAnnouncement(announcement))
      }
    },
    [],
  )

  const value = useMemo<LiveAnnouncerContextValue>(() => ({ announce }), [announce])

  return (
    <LiveAnnouncerContext.Provider value={value}>
      {children}
      <LiveRegion
        politeness="polite"
        message={politeAnnouncement.message}
        announcementId={politeAnnouncement.id}
      />
      <LiveRegion
        politeness="assertive"
        message={assertiveAnnouncement.message}
        announcementId={assertiveAnnouncement.id}
      />
    </LiveAnnouncerContext.Provider>
  )
}
