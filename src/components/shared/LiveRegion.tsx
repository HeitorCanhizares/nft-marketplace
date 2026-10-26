import type { Politeness } from '@/contexts/liveAnnouncer'

export interface LiveRegionProps {
  politeness: Politeness
  message: string
}

export function LiveRegion({ politeness, message }: LiveRegionProps) {
  const isAssertive = politeness === 'assertive'

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
