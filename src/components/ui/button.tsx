import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-mobile border border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 lg:rounded-lg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary font-bold text-primary-foreground hover:bg-primary/90',
        outline:
          'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        link: 'h-auto rounded-none border-transparent bg-transparent p-0 text-primary underline-offset-4 hover:underline',
        icon: 'border-transparent bg-muted text-foreground hover:bg-muted/80',
        gradient:
          'bg-gradient-primary font-bold text-primary-foreground hover:opacity-90 lg:bg-primary lg:hover:bg-primary/90',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-caption-md',
        lg: 'h-11 px-5 max-lg:h-15',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
