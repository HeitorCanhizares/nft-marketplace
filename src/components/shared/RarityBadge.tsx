import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type RarityBadgeProps = {
  className?: string
}

export function RarityBadge({ className }: RarityBadgeProps) {
  return (
    <Badge className={cn('h-7.5 min-w-17 px-3 text-caption-md lg:min-w-20', className)}>RARO</Badge>
  )
}
