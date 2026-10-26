import { RefreshCwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PriceChangedNoticeProps = {
  kind: 'updated' | 'sold-out'
  className?: string
}

export function PriceChangedNotice({ kind, className }: PriceChangedNoticeProps) {
  if (kind === 'sold-out') {
    return (
      <Badge
        variant="outline"
        className={cn('border-destructive text-caption text-destructive', className)}
      >
        Esgotado
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn('text-caption', className)}>
      <RefreshCwIcon aria-hidden="true" className="size-3" />
      Atualizado
    </Badge>
  )
}
