# 04-017 — Dados de navegação (cabeçalho e menu do perfil)

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Base de layout
**Depende de:** 04-010

## Objetivo
Definir em um só lugar os itens do cabeçalho e do menu do perfil (rótulo, destino, ícone, desabilitado, regra de item ativo), para serem usados por `Header`, `ProfileSidebar` e, na fase 09, pela lista do mobile.

## Arquivos
- criar: `src/components/layout/navItems.ts`, `src/components/layout/profileMenuItems.ts`

## Referências
- docs/decisoes.md (A3: "Mercado" leva a `/#catalogo` e fica ativo em `/nft/*`, `/carrinho` e `/pagamento`)
- docs/design/componentes.md (`Header`, `ProfileSidebar`) e docs/fluxos/perfil.md (subitem 1)
- Capturas: desktop-perfil.png (itens e ícones do menu), desktop-carrinho.png (aba ativa "Mercado")

## Instruções
1. `navItems.ts`: `type NavItem = { id: 'home' | 'market' | 'creators' | 'learn'; label: string; to?: '/'; hash?: string; disabled?: boolean; isActive: (pathname: string) => boolean }` e `NAV_ITEMS` na ordem do Figma:
   - Início: `to: '/'`, ativo quando `pathname === '/'`;
   - Mercado: `to: '/'`, `hash: 'catalogo'`, ativo quando `pathname` começa com `/nft/`, ou é `/carrinho`, `/pagamento` ou começa com `/pedido/` (o fundo do modal de Confirmação é o Pagamento);
   - Criadores e Aprenda: `disabled: true`, `isActive: () => false`.
   Na Início o item "Início" fica ativo e "Mercado" não, mesmo depois de clicar em Mercado (`/#catalogo`): é o comportamento do Figma.
2. `profileMenuItems.ts`: `type ProfileMenuItem = { id: string; label: string; icon: LucideIcon; to?: '/perfil/dados' | '/perfil/carteiras'; disabled?: boolean }` (`LucideIcon` de `lucide-react`) e `PROFILE_MENU_ITEMS`, na ordem do Figma:
   | Rótulo | Ícone (lucide) | Estado |
   |---|---|---|
   | Dados do perfil | `UserIcon` | `to: '/perfil/dados'` |
   | Carteiras | `MapPinIcon` | `to: '/perfil/carteiras'` |
   | Atividade | `ShoppingCartIcon` | desabilitado |
   | Lista de interesse | `HeartIcon` | desabilitado |
   | Ofertas | `SquareActivityIcon` | desabilitado |
   | Arquivos baixados | `DownloadIcon` | desabilitado |
   | Suporte | `TriangleAlertIcon` | desabilitado |
   Exportar também `PROFILE_SIGN_OUT = { label: 'Sair', icon: LogOutIcon }` (fora da lista: o "Sair" é ação, não link). Se algum nome de ícone não existir na versão instalada do `lucide-react`, escolher o mais próximo e **relatar**.
3. Só dados e tipos: sem JSX, sem hooks. Comentário de uma linha no topo de cada arquivo dizendo quem consome.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/navItems.ts src/components/layout/profileMenuItems.ts` (e remover o `src/components/layout/.gitkeep`) e `git commit -m "04-017: dados de navegação"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] `NAV_ITEMS` e `PROFILE_MENU_ITEMS` na ordem do Figma; só Dados e Carteiras com `to`.
- [ ] `isActive('/nft/abc')`, `isActive('/carrinho')`, `isActive('/pagamento')` e `isActive('/pedido/x')` verdadeiros só para Mercado; `isActive('/perfil/dados')` falso para todos (correção do Figma: nenhuma aba ativa no Perfil).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 04-033 (item ativo por rota).
