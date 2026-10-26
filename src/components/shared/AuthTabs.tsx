import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

type AuthTabsProps = {
  active: 'login' | 'signup'
  redirect?: string
  className?: string
}

const TAB_CLASS = 'relative text-xl leading-5 font-medium'
const TAB_ACTIVE_CLASS =
  'text-price after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-primary'
const TAB_INACTIVE_CLASS = 'text-foreground'

// Abas de troca de tela: links para as rotas, mantendo o redirect. Cor e sublinhado marcam a ativa.
export function AuthTabs({ active, redirect, className }: AuthTabsProps) {
  const isLogin = active === 'login'

  return (
    <nav aria-label="Entrar ou criar conta" className={className}>
      <ul className="flex items-center justify-center gap-2.25">
        <li>
          <Link
            to="/entrar"
            search={{ redirect }}
            aria-current={isLogin ? 'page' : undefined}
            className={cn(TAB_CLASS, isLogin ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS)}
          >
            Entrar
          </Link>
        </li>
        <li aria-hidden="true" className="h-5 w-0.5 bg-required/50" />
        <li>
          <Link
            to="/cadastro"
            search={{ redirect }}
            aria-current={isLogin ? undefined : 'page'}
            className={cn(TAB_CLASS, isLogin ? TAB_INACTIVE_CLASS : TAB_ACTIVE_CLASS)}
          >
            Criar conta
          </Link>
        </li>
      </ul>
    </nav>
  )
}
