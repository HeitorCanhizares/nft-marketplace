import { Link, useLocation } from '@tanstack/react-router'

import { ComingSoon } from '@/components/shared/ComingSoon'
import { cn } from '@/lib/utils'

import { PROFILE_MENU_ITEMS, PROFILE_SIGN_OUT } from './profileMenuItems'

type ProfileSidebarProps = {
  onSignOut: () => void
  className?: string
}

const ITEM_CLASS =
  'relative flex h-11.25 w-full items-center gap-3 pl-4 text-body text-price focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'

export function ProfileSidebar({ onSignOut, className }: ProfileSidebarProps) {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <aside aria-label="Menu do perfil" className={cn('w-[310px] bg-card py-4', className)}>
      <nav aria-label="Meu perfil">
        <h2 className="flex h-11 items-center pl-2.5 text-lg font-bold text-foreground">
          Meu perfil
        </h2>

        <ul>
          {PROFILE_MENU_ITEMS.map((item) => {
            const Icon = item.icon

            if (item.disabled || !item.to) {
              return (
                <li key={item.id}>
                  <ComingSoon className={ITEM_CLASS}>
                    <Icon className="size-5 shrink-0 text-tan" aria-hidden="true" />
                    {item.label}
                  </ComingSoon>
                </li>
              )
            }

            const active = pathname.startsWith(item.to)

            return (
              <li key={item.id}>
                <Link
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(ITEM_CLASS, active && 'font-bold')}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1.5 bg-primary"
                    />
                  ) : null}
                  <Icon
                    className={cn('size-5 shrink-0', active ? 'text-primary' : 'text-tan')}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div aria-hidden="true" className="my-2 h-px bg-border-soft" />

      <button type="button" onClick={onSignOut} className={cn(ITEM_CLASS, 'font-bold')}>
        <PROFILE_SIGN_OUT.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
        {PROFILE_SIGN_OUT.label}
      </button>
    </aside>
  )
}
