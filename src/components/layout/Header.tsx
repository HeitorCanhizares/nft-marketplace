import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LogInIcon, ShoppingCartIcon } from 'lucide-react'

import { ComingSoon } from '@/components/shared/ComingSoon'
import { SearchInput } from '@/components/shared/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { NAV_ITEMS } from './navItems'
import { UserMenu } from './UserMenu'

type HeaderProps = {
  authStatus: 'loading' | 'authenticated' | 'anonymous'
  user: User | null
  cartCount: number
  onSignOut: () => void
  onSearch: (query: string) => void
  searchQuery?: string
  className?: string
}

// O Link marca aria-current sozinho por prefixo ("/" casaria com todas as rotas e o hash seria
// ignorado); aqui só conta a rota exata. Quem decide o item ativo é o isActive do NAV_ITEMS.
const NAV_ACTIVE_OPTIONS = { exact: true, includeSearch: false, includeHash: true }

const AUTH_ROUTES = ['/entrar', '/cadastro']

function cartLabel(cartCount: number) {
  if (cartCount === 0) return 'Carrinho'
  if (cartCount === 1) return 'Carrinho, 1 item'
  return `Carrinho, ${cartCount} itens`
}

export function Header({
  authStatus,
  user,
  cartCount,
  onSignOut,
  onSearch,
  searchQuery,
  className,
}: HeaderProps) {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = location.pathname
  const redirectSearch = AUTH_ROUTES.includes(pathname) ? undefined : { redirect: location.href }

  return (
    <header className={className}>
      <div className="container-page">
        <div className="grid h-17 grid-cols-[1fr_auto_1fr] items-center border-b border-border-strong">
          <Link
            to="/"
            aria-label="Kurio, página inicial"
            activeOptions={NAV_ACTIVE_OPTIONS}
            className="mt-3.5 justify-self-start text-sm font-bold tracking-[0.07em] text-foreground"
          >
            KURIO
          </Link>

          <nav aria-label="Navegação principal" className={cn('h-full', searchOpen && 'invisible')}>
            <ul className="flex h-full items-center gap-10">
              {NAV_ITEMS.map((item) => {
                const isActive = item.isActive(pathname)

                if (item.disabled || !item.to) {
                  return (
                    <li key={item.id}>
                      <ComingSoon className="text-body text-foreground">{item.label}</ComingSoon>
                    </li>
                  )
                }

                return (
                  <li key={item.id} className="h-full">
                    <Link
                      to={item.to}
                      hash={item.hash}
                      activeOptions={NAV_ACTIVE_OPTIONS}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex h-full items-center text-body text-foreground',
                        isActive && 'font-bold text-price',
                      )}
                    >
                      {item.label}
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-px h-[3px] bg-primary"
                        />
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="mt-6 flex items-center justify-end gap-4.5 self-start">
            <SearchInput
              initialQuery={searchQuery}
              onSearch={onSearch}
              onOpenChange={setSearchOpen}
            />

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative size-8 text-foreground hover:bg-transparent"
            >
              <Link to="/carrinho" aria-label={cartLabel(cartCount)}>
                <ShoppingCartIcon className="size-5.5" />
                {cartCount > 0 ? (
                  <Badge
                    variant="count"
                    aria-hidden="true"
                    className="absolute top-1 -right-1 text-tiny"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                ) : null}
              </Link>
            </Button>

            {authStatus === 'loading' ? (
              <Skeleton className="ml-3.25 h-9 w-25 rounded-mobile lg:rounded-lg" />
            ) : authStatus === 'authenticated' && user ? (
              <UserMenu user={user} onSignOut={onSignOut} className="ml-3.25" />
            ) : (
              <Button asChild className="ml-3.25 h-9 px-2.5 text-base">
                <Link to="/entrar" search={redirectSearch}>
                  <LogInIcon />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
