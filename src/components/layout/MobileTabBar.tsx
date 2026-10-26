import { Link, useLocation } from '@tanstack/react-router'
import { HeartIcon, HouseIcon, ScanLineIcon } from 'lucide-react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { ComingSoon } from '@/components/shared/ComingSoon'
import { cn } from '@/lib/utils'

// Altura da barra (sem a área segura): o AppShell usa para o padding-bottom do conteúdo e o Toaster.
export const MOBILE_TAB_BAR_HEIGHT = 96

type MobileTabBarProps = {
  // Só entra no aria-label do carrinho; a barra não desenha contador (Figma).
  cartCount?: number
  className?: string
}

function cartLabel(cartCount: number) {
  if (cartCount === 0) return 'Carrinho'
  if (cartCount === 1) return 'Carrinho, 1 item'
  return `Carrinho, ${cartCount} itens`
}

function tabClass(active: boolean) {
  return cn(
    'relative flex min-h-11 min-w-11 flex-col items-center justify-center',
    active ? 'text-price' : 'text-muted-foreground',
  )
}

function ActiveDot({ active }: { active: boolean }) {
  if (!active) return null
  return <span aria-hidden="true" className="absolute bottom-0 size-1 rounded-full bg-price" />
}

export function MobileTabBar({ cartCount = 0, className }: MobileTabBarProps) {
  const { pathname, search } = useLocation({
    select: (location) => ({ pathname: location.pathname, search: location.search }),
  })
  const favoritos = (search as { favoritos?: unknown }).favoritos === 1
  const isHome = pathname === '/'
  const homeActive = isHome && !favoritos
  const favoritesActive = isHome && favoritos
  const cartActive = pathname === '/carrinho'
  const profileActive = pathname.startsWith('/perfil')

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 h-[calc(6rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {/* Fundo com recorte circular atrás do botão central; fica separado para não recortar o botão. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-t-[2.5rem] bg-card [mask-image:radial-gradient(circle_52px_at_50%_0,transparent_99%,black_100%)]"
      />

      <ul className="relative grid h-24 grid-cols-5 items-center px-2">
        <li className="flex justify-center">
          <Link
            to="/"
            aria-label="Início"
            aria-current={homeActive ? 'page' : undefined}
            className={tabClass(homeActive)}
          >
            <HouseIcon className={cn('size-6', homeActive && 'fill-current')} />
            <ActiveDot active={homeActive} />
          </Link>
        </li>

        <li className="flex justify-center">
          <Link
            to="/"
            search={{ favoritos: 1 }}
            aria-label="Favoritos"
            aria-current={favoritesActive ? 'page' : undefined}
            className={tabClass(favoritesActive)}
          >
            <HeartIcon className={cn('size-6', favoritesActive && 'fill-current')} />
            <ActiveDot active={favoritesActive} />
          </Link>
        </li>

        <li className="relative flex justify-center">
          <ComingSoon className="absolute -top-8 flex size-16 items-center justify-center rounded-full bg-gradient-primary text-foreground">
            <ScanLineIcon className="size-7" />
            <span className="sr-only">Ação central</span>
          </ComingSoon>
        </li>

        <li className="flex justify-center">
          <Link
            to="/carrinho"
            aria-label={cartLabel(cartCount)}
            aria-current={cartActive ? 'page' : undefined}
            className={tabClass(cartActive)}
          >
            <SvgIcon name="shop" size={24} />
            <ActiveDot active={cartActive} />
          </Link>
        </li>

        <li className="flex justify-center">
          <Link
            to="/perfil"
            aria-label="Perfil"
            aria-current={profileActive ? 'page' : undefined}
            className={tabClass(profileActive)}
          >
            <SvgIcon name="user" size={24} />
            <ActiveDot active={profileActive} />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
