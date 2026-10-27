# 09-013 — Página `Profile` e rota `/perfil/dados`

**Status:** concluído
**Fluxo / subitem:** Perfil › 1 (layout), 2, 9 (carregando e erro)
**Depende de:** 09-010, 09-012

## Objetivo
Ligar tudo na rota `/perfil/dados`: cabeçalho por viewport, skeleton, `ErrorState` e o formulário.

## Arquivos
- criar: `src/pages/Profile/Profile.tsx`
- alterar: `src/routes/perfil.dados.tsx`
- criar: `src/pages/Profile/ProfileSkeleton.tsx`

## Referências
- Tela: `docs/design/telas/desktop-perfil.png` (1:1); mobile adaptado
- Padrão: `src/pages/Cart/Cart.tsx` (`PageHeader` local, `useIsDesktop`, `ErrorState`), `src/routes/carrinho.tsx`
- `ProfileLayout` (já aplica `ProfileSidebar` e a coluna de 310 px + 28 px de espaço no desktop), `MobileTopBar`, `FormSkeleton`, `ErrorState`, `useProfile` (09-005), `ProfileForm` (09-012)

## Instruções
1. **`Profile.tsx`**: `useProfile()`.
   - **`PageHeader` local:** desktop → `<h1 className="sr-only">Dados do perfil</h1>` (o Figma não mostra título de página; o título visível é o `h2` "Perfil do colecionador"); mobile → `<MobileTopBar title="Dados do perfil" backTo={{ to: '/perfil' }} />`.
   - Carregando → `ProfileSkeleton`. Erro → `ErrorState` com "Tentar novamente" (`refetch`), `as="h2"`. Sucesso → `<ProfileForm user={data} />`.
   - Mobile: conteúdo com margem lateral de 28 px (`px-7 lg:px-0`) e 32 px de espaço inferior; a `MobileTabBar` não aparece (a rota não define `mobileTabBar`).
2. **`ProfileSkeleton.tsx`**: espelha o desktop (`lg:grid-cols-2` com 417 px por coluna e 28 px de espaço; blocos de 40 px de altura) e o mobile (uma coluna, campos de 50 px); título do bloco e botão "Salvar" 131 × 40 px. `role="status"`, `aria-busy`, texto só para leitor de tela "Carregando perfil…". Pode reutilizar `FormSkeleton` se as medidas baterem; senão, componente próprio com `Skeleton`.
3. **`perfil.dados.tsx`**: manter `staticData: { title: 'Dados do perfil' }` e usar `component: Profile`.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-013: página e rota de dados do perfil`.

## Critérios de aceite
- [ ] Desktop: sidebar com "Dados do perfil" ativo + formulário na coluna de 862 px, como no Figma. Mobile: barra superior com voltar para `/perfil`, uma coluna.
- [ ] Skeleton sem salto de layout ao carregar; erro mostra "Tentar novamente" e funciona.
- [ ] Um único `h1` por viewport; título do documento "Dados do perfil | Kurio".
- [ ] Sem `ref` no render; sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 09-014.
