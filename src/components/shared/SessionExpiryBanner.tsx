import { CircleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SessionExpiryBannerProps = {
  onContinue: () => void
  pending: boolean
  error?: string
  className?: string
}

const TITLE_ID = 'session-expiry-title'
const DESCRIPTION_ID = 'session-expiry-description'

// Faixa no topo, sem foco automático: não tira o foco de quem está digitando.
export function SessionExpiryBanner({
  onContinue,
  pending,
  error,
  className,
}: SessionExpiryBannerProps) {
  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby={TITLE_ID}
      aria-describedby={DESCRIPTION_ID}
      className={cn(
        'sticky top-0 z-50 border-b border-border-strong bg-secondary text-secondary-foreground',
        className,
      )}
    >
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <h2 id={TITLE_ID} className="text-sm font-bold text-foreground">
            Sua sessão expira em breve
          </h2>
          <p id={DESCRIPTION_ID} className="text-caption-md text-muted-foreground">
            Em menos de 2 minutos você será desconectado. Quer continuar conectado?
          </p>
          {error && (
            <p role="alert" className="mt-1 flex items-start gap-1.5 text-caption text-destructive">
              <CircleAlertIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <Button
          type="button"
          className="h-9 px-3 text-sm"
          aria-busy={pending || undefined}
          aria-disabled={pending || undefined}
          onClick={() => {
            if (!pending) onContinue()
          }}
        >
          {pending ? 'Renovando…' : 'Continuar conectado'}
        </Button>
      </div>
    </div>
  )
}
