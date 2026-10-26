import type { Politeness } from '@/contexts/liveAnnouncer'

export interface LiveRegionProps {
  politeness: Politeness
  message: string
  announcementId?: number
}

export function LiveRegion({ politeness, message, announcementId = 0 }: LiveRegionProps) {
  const isAssertive = politeness === 'assertive'

  // A key muda a cada anúncio: o React remove o nó anterior e insere um nó novo,
  // mesmo quando o texto é igual ao da mensagem anterior.
  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      <span key={announcementId}>{message}</span>
    </div>
  )
}
