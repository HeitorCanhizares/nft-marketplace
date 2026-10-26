import type { ComponentProps, MouseEvent, ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ComingSoonProps = Omit<ComponentProps<'button'>, 'type' | 'disabled' | 'onClick'> & {
  children: ReactNode
  label?: string
  className?: string
}

export function ComingSoon({ children, label = 'Em breve', className, ...props }: ComingSoonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          {...props}
          type="button"
          aria-disabled="true"
          onClick={handleClick}
          className={cn('cursor-not-allowed', className)}
        >
          {children}
          <span className="sr-only"> (em breve)</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
