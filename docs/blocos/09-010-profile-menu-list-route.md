# 09-010 — `ProfileMenuList` e a rota `/perfil`

**Status:** concluído
**Fluxo / subitem:** Perfil › 1 (layout e navegação), 8 (sair)
**Depende de:** 09-001

## Objetivo
No mobile, `/perfil` mostra o menu em lista; no desktop, redireciona para `/perfil/dados`.

## Arquivos
- criar: `src/components/layout/ProfileMenuList.tsx`
- alterar: `src/routes/perfil.index.tsx`

## Referências
- docs/fluxos/perfil.md (subitem 1); docs/design/componentes.md (`ProfileMenuList`); **não existe Figma mobile**: adaptar do `ProfileSidebar` (desktop-perfil.png: item 45 px, texto 15 px, ícone 20 px `tan`, divisor, "Sair" em negrito) com a linguagem do mobile (margens 28 px, `MobileTopBar`)
- `src/components/layout/profileMenuItems.ts` (`PROFILE_MENU_ITEMS`, `PROFILE_SIGN_OUT`), `ProfileSidebar.tsx` (classes dos itens), `ComingSoon`, `MobileTopBar`, `useSignOut`, `useIsDesktop` e `DESKTOP_MEDIA_QUERY` (`src/hooks/useMediaQuery.ts`), `useAuth`

## Instruções
1. **`ProfileMenuList`** — props: `{ user: Pick<User, 'displayName' | 'username' | 'avatarUrl'>; onSignOut: () => void; className?: string }`.
   - **Topo:** `Avatar` de 64 px (`className="size-16"`, `AvatarImage` com `alt=""` e fallback com a inicial como no `UserMenu`), ao lado nome de exibição (18 px, bold, `truncate`) e `@username` (12 px, `tan`); bloco com 24 px de espaço abaixo.
   - **Lista** (`<nav aria-label="Meu perfil">` com `<ul>`): um item por `PROFILE_MENU_ITEMS`. Item = linha de **56 px**, ícone 20 px (`tan`), texto 15 px (`price`), chevron `ChevronRightIcon` 16 px à direita (só nos habilitados), divisor `border-soft` entre linhas. Habilitados são `Link` para `item.to`; desabilitados usam `ComingSoon` (mesmo padrão do `ProfileSidebar`; com `Tooltip` e "(em breve)" para leitor de tela). Foco visível com `ring`.
   - **Sair:** depois de um divisor, linha de 56 px com ícone `primary` e texto 15 px bold, `button type="button"` que chama `onSignOut`.
   - Sem título interno (o título "Meu perfil" é o `h1` da `MobileTopBar`).
2. **`perfil.index.tsx`**: manter `staticData: { title: 'Meu perfil', mobileTabBar: true }`. Acrescentar `beforeLoad`: se `window.matchMedia(DESKTOP_MEDIA_QUERY).matches` → `throw redirect({ to: '/perfil/dados', replace: true })`. Componente (no próprio arquivo): se `useIsDesktop()` → `<Navigate to="/perfil/dados" replace />` (cobre redimensionar a janela); senão `MobileTopBar title="Meu perfil"` + `ProfileMenuList` com `user` de `useAuth()` (usuário `null` → não renderiza a lista) e `onSignOut={useSignOut()}`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-010: menu do perfil no mobile`.

## Critérios de aceite
- [ ] Mobile: topo com avatar e nome, itens com os mesmos rótulos do menu lateral, só Dados, Carteiras e Sair ativos; desktop: `/perfil` vai a `/perfil/dados` sem piscar.
- [ ] "Sair" usa o mesmo fluxo de logout do `UserMenu` (`useSignOut`).
- [ ] Acessibilidade: um `h1` (da `MobileTopBar`); alvos ≥ 44 px; foco visível; sem overflow em 320 px.
- [ ] Sem cor hexadecimal fora dos tokens; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 09-014 (mobile, uma captura).
