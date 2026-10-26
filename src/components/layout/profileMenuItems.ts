// Itens do menu do perfil (ProfileSidebar); também consumido pela lista do mobile (fase 09).

import {
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  SquareActivityIcon,
  TriangleAlertIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'

export type ProfileMenuItem = {
  id: string
  label: string
  icon: LucideIcon
  to?: '/perfil/dados' | '/perfil/carteiras'
  disabled?: boolean
}

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  { id: 'dados', label: 'Dados do perfil', icon: UserIcon, to: '/perfil/dados' },
  { id: 'carteiras', label: 'Carteiras', icon: MapPinIcon, to: '/perfil/carteiras' },
  { id: 'atividade', label: 'Atividade', icon: ShoppingCartIcon, disabled: true },
  { id: 'lista-interesse', label: 'Lista de interesse', icon: HeartIcon, disabled: true },
  { id: 'ofertas', label: 'Ofertas', icon: SquareActivityIcon, disabled: true },
  { id: 'arquivos-baixados', label: 'Arquivos baixados', icon: DownloadIcon, disabled: true },
  { id: 'suporte', label: 'Suporte', icon: TriangleAlertIcon, disabled: true },
]

// "Sair" é ação, não link: fica fora da lista.
export const PROFILE_SIGN_OUT = { label: 'Sair', icon: LogOutIcon }
