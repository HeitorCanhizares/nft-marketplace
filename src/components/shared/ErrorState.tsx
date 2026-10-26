import { TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  retrying?: boolean
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

const DEFAULT_TITLE = 'Algo deu errado'
const DEFAULT_MESSAGE =
  'Não foi possível carregar este conteúdo. Verifique sua conexão e tente novamente.'
const DEFAULT_RETRY_LABEL = 'Tentar novamente'

export function ErrorState({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  onRetry,
  retryLabel = DEFAULT_RETRY_LABEL,
  retrying = false,
  as: Heading = 'h2',
  className,
}: ErrorStateProps) {
  function handleRetry() {
    if (retrying || !onRetry) return
    onRetry()
  }

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-card text-destructive [&_svg]:size-8"
      >
        <TriangleAlertIcon />
      </div>
      <Heading className="text-lg font-bold text-foreground">{title}</Heading>
      <p className="text-body text-muted-foreground">{message}</p>
      {onRetry ? (
        <div className="mt-2">
          <Button
            type="button"
            variant="default"
            aria-busy={retrying || undefined}
            aria-disabled={retrying || undefined}
            onClick={handleRetry}
          >
            {retrying ? 'Tentando novamente…' : retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
