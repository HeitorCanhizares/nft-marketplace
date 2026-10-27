import type { ReactNode } from 'react'
import { Link, type LinkProps, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MobileTopBarProps = {
  title: string
  backTo?: LinkProps
  fallbackTo?: LinkProps
  action?: ReactNode
  className?: string
}

const HOME_LINK: LinkProps = { to: '/' }

export function MobileTopBar({
  title,
  backTo,
  fallbackTo = HOME_LINK,
  action,
  className,
}: MobileTopBarProps) {
  const router = useRouter()
  const navigate = useNavigate()

  function handleBack() {
    if (router.history.canGoBack()) {
      router.history.back()
      return
    }
    navigate(fallbackTo)
  }

  const backButtonClassName = 'size-9 rounded-full border-border text-tan'

  return (
    <header
      className={cn(
        'grid grid-cols-[36px_1fr_36px] items-center px-7 pt-[calc(var(--spacing)*8+env(safe-area-inset-top))] pb-5 lg:hidden',
        className,
      )}
    >
      {backTo ? (
        <Button
          asChild
          variant="icon"
          size="icon"
          aria-label="Voltar"
          className={backButtonClassName}
        >
          <Link {...backTo}>
            <ChevronLeftIcon />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="icon"
          size="icon"
          aria-label="Voltar"
          onClick={handleBack}
          className={backButtonClassName}
        >
          <ChevronLeftIcon />
        </Button>
      )}
      <h1 className="min-w-0 translate-x-3 text-center text-xl font-bold break-words text-foreground">
        {title}
      </h1>
      <div className="flex size-9 items-center justify-center justify-self-end">{action}</div>
    </header>
  )
}
