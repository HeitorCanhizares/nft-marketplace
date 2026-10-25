import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-primary" />,
        warning: <TriangleAlertIcon className="size-4 text-primary" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: 'Fechar',
        classNames: {
          toast: 'cn-toast bg-card text-foreground border-border',
          actionButton:
            'bg-primary text-primary-foreground rounded-[var(--radius)] px-3 py-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          closeButton:
            'text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
