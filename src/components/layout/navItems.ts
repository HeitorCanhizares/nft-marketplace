// Itens do cabeçalho (desktop); também consumido pela lista de navegação do mobile (fase 09).

export type NavItem = {
  id: 'home' | 'market' | 'creators' | 'learn'
  label: string
  to?: '/'
  hash?: string
  disabled?: boolean
  isActive: (pathname: string) => boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Início',
    to: '/',
    isActive: (pathname) => pathname === '/',
  },
  {
    id: 'market',
    label: 'Mercado',
    to: '/',
    hash: 'catalogo',
    isActive: (pathname) =>
      pathname.startsWith('/nft/') ||
      pathname === '/carrinho' ||
      pathname === '/pagamento' ||
      pathname.startsWith('/pedido/'),
  },
  {
    id: 'creators',
    label: 'Criadores',
    disabled: true,
    isActive: () => false,
  },
  {
    id: 'learn',
    label: 'Aprenda',
    disabled: true,
    isActive: () => false,
  },
]
