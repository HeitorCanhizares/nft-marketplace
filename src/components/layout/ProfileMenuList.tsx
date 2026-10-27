import { Link } from '@tanstack/react-router'
import { ChevronRightIcon, LogOutIcon } from 'lucide-react'

import { ComingSoon } from '@/components/shared/ComingSoon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { PROFILE_MENU_ITEMS, PROFILE_SIGN_OUT } from './profileMenuItems'

type ProfileMenuListProps = {
  user: Pick<User, 'displayName' | 'username' | 'avatarUrl'>
  onSignOut: () => void
  className?: string
}

const ROW_CLASS =
  'flex h-14 w-full items-center gap-3 text-body text-price focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'

// Menu do perfil no mobile: lista de linhas de 56 px, com "Sair" no fim.
export function ProfileMenuList({ user, onSignOut, className }: ProfileMenuListProps) {
  const initial = user.displayName.trim().charAt(0).toUpperCase()

  return (
    <div className={cn('flex flex-col px-7', className)}>
      <div className="flex items-center gap-4 pb-6">
        <Avatar className="size-16 shrink-0">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback className="text-lg font-bold">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-bold text-foreground">{user.displayName}</span>
          <span className="truncate text-caption text-tan">@{user.username}</span>
        </div>
      </div>

      <nav aria-label="Meu perfil">
        <ul>
          {PROFILE_MENU_ITEMS.map((item, index) => {
            const Icon = item.icon
            const border = index > 0 ? 'border-t border-border-soft' : undefined

            if (item.disabled || !item.to) {
              return (
                <li key={item.id} className={border}>
                  <ComingSoon className={cn(ROW_CLASS, 'cursor-not-allowed')}>
                    <Icon className="size-5 shrink-0 text-tan" aria-hidden="true" />
                    {item.label}
                  </ComingSoon>
                </li>
              )
            }

            return (
              <li key={item.id} className={border}>
                <Link to={item.to} className={ROW_CLASS}>
                  <Icon className="size-5 shrink-0 text-tan" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRightIcon className="size-4 shrink-0 text-tan" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-2 border-t border-border-soft">
        <button type="button" onClick={onSignOut} className={cn(ROW_CLASS, 'font-bold')}>
          <LogOutIcon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>{PROFILE_SIGN_OUT.label}</span>
        </button>
      </div>
    </div>
  )
}
