import { Link } from '@tanstack/react-router'
import { LogOutIcon, MapPinIcon, UserIcon } from 'lucide-react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@/types/user'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  user: Pick<User, 'displayName' | 'avatarUrl'>
  onSignOut: () => void
  className?: string
}

export function UserMenu({ user, onSignOut, className }: UserMenuProps) {
  const initial = Array.from(user.displayName.trim())[0]?.toUpperCase() ?? ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Menu de ${user.displayName}`}
          className={cn('h-9 max-w-50 gap-2 px-2', className)}
        >
          <Avatar size="sm">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback data-initial={initial} className="after:content-[attr(data-initial)]" />
          </Avatar>
          <span className="min-w-0 truncate text-sm">{user.displayName}</span>
          <SvgIcon name="arrow-down" className="text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/perfil/dados">
            <UserIcon />
            Dados do perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/carteiras">
            <MapPinIcon />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
