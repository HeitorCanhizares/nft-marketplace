import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  as: Heading = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-full bg-card text-primary [&_svg]:size-8"
        >
          {icon}
        </div>
      ) : null}
      <Heading className="text-lg font-bold text-foreground">{title}</Heading>
      {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
