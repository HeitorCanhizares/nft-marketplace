import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TextDividerProps = {
  children: ReactNode
  className?: string
}

export function TextDivider({ children, className }: TextDividerProps) {
  return (
    <div
      className={cn('flex items-center gap-3 text-caption-md leading-4 text-foreground', className)}
    >
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}
