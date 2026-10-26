// Colunas de links do rodapé (desktop). Só "Meu perfil" e as coleções têm tela; o resto fica desabilitado.

export type FooterLink = {
  label: string
  to?: '/' | '/perfil'
  search?: { colecao?: string }
  disabled?: boolean
}

export type FooterColumn = {
  title: string
  links: FooterLink[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/perfil' },
      { label: 'Minha coleção', disabled: true },
      { label: 'Atividade', disabled: true },
      { label: 'Estúdio do criador', disabled: true },
      { label: 'Lista de interesse', disabled: true },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', disabled: true },
      { label: 'Como comprar NFTs', disabled: true },
      { label: 'Carteira e segurança', disabled: true },
      { label: 'Política do mercado', disabled: true },
      { label: 'Denunciar item', disabled: true },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', to: '/', search: { colecao: 'arte-digital' } },
      { label: 'Fotografia', to: '/', search: { colecao: 'fotografia' } },
      { label: 'Música', to: '/', search: { colecao: 'musica' } },
      { label: 'Arte 3D', to: '/', search: { colecao: 'arte-3d' } },
      { label: 'Utilidade', to: '/', search: { colecao: 'utilidade' } },
    ],
  },
]
