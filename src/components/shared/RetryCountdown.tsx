import { useEffect, useRef, useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'

import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { cn } from '@/lib/utils'

const TICK_MS = 250

type RetryCountdownProps = {
  seconds: number
  onFinish: () => void
  className?: string
}

function segundos(total: number): string {
  return `${total} ${total === 1 ? 'segundo' : 'segundos'}`
}

// Contagem baseada em Date.now (não em contar ticks), então não deriva e respeita o relógio do teste.
export function RetryCountdown({ seconds, onFinish, className }: RetryCountdownProps) {
  const { announce } = useLiveAnnouncer()
  const [remaining, setRemaining] = useState(seconds)
  const endAtRef = useRef<number | null>(null)
  const announcedStartRef = useRef(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    // O fim é fixado na primeira montagem; reexecuções do efeito (ex.: StrictMode) não reiniciam a contagem.
    if (endAtRef.current === null) {
      endAtRef.current = Date.now() + seconds * 1000
    }
    const endAt = endAtRef.current

    if (!announcedStartRef.current) {
      announcedStartRef.current = true
      announce(`Muitas tentativas. Tente novamente em ${segundos(seconds)}.`, 'assertive')
    }

    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setRemaining(next)

      if (next > 0) return

      window.clearInterval(id)
      if (finishedRef.current) return

      finishedRef.current = true
      announce('Você já pode tentar novamente.', 'polite')
      onFinish()
    }, TICK_MS)

    return () => window.clearInterval(id)
  }, [seconds, announce, onFinish])

  return (
    <div
      role="timer"
      className={cn('flex items-center gap-1.5 text-sm text-destructive', className)}
    >
      <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{`Tente novamente em ${segundos(remaining)}.`}</span>
    </div>
  )
}
