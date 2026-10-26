# 04-030 — AppShell

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Layout
**Depende de:** 04-001, 04-005, 04-011, 04-012, 04-022, 04-026, 04-027

## Objetivo
Montar a moldura de todas as telas: link "Pular para o conteúdo", cabeçalho + rodapé no desktop, barra inferior no mobile, `<main>`, `Toaster` e `TooltipProvider`.

## Arquivos
- criar: `src/components/layout/AppShell.tsx`

## Referências
- docs/design/componentes.md (`AppShell`; pendências da fase 01: `<Toaster />` embaixo à direita no desktop; setas do carrossel sem rolagem horizontal)
- docs/decisoes.md (A5) e docs/qualidade/acessibilidade.md (link "Pular para o conteúdo", landmarks)
- Capturas: desktop-perfil.png (conteúdo começa 32 px abaixo da linha do cabeçalho: `y` 69 → 101), mobile-inicio.png

## Instruções
1. `AppShell()` sem props; renderiza `<Outlet />` (de `@tanstack/react-router`) dentro do `main`. Chama `useRouteFocus()` (04-012). Lê a sessão com `useAuth()` (`status`, `user`) e `signOut = useSignOut()`; lê `useRouteChrome()` (`footer`, `mobileTabBar`); `useIsDesktop()` (04-001) só para a posição do `Toaster`.
2. Estrutura (nesta ordem no DOM):
   - **Link "Pular para o conteúdo":** `<a href="#conteudo">` visível só com foco (`sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 …` com `bg-primary text-primary-foreground`). O `onClick` faz `preventDefault()` e `document.getElementById('conteudo')?.focus()` (evita que o roteador trate o hash).
   - `div.flex.min-h-dvh.flex-col.overflow-x-clip` (o `clip`, e não `hidden`, contém as setas do carrossel que ficam 48 px fora do container sem criar contexto de rolagem; o `position: sticky` continua funcionando).
   - `Header` com `className="max-lg:hidden"` e as props: `authStatus={status}`, `user`, `cartCount={0}` (**provisório**: as fases 07/08 trocam por um hook da query do carrinho; comentar isso), `onSignOut`, `searchQuery` (o `q` da URL da Início, via `useSearch({ strict: false })`) e `onSearch` (`navigate({ to: '/', search: { q }, hash: 'catalogo' })`).
   - `main#conteudo` com `tabIndex={-1}`, `className="flex-1 outline-none lg:pt-8"` (32 px abaixo do cabeçalho no desktop). Com `mobileTabBar` ativo, no mobile: `max-lg:pb-[calc(96px+env(safe-area-inset-bottom))]` (usar `MOBILE_TAB_BAR_HEIGHT` do 04-027).
   - `Footer` (`className="max-lg:hidden"`) só quando `footer` for `true`.
   - `MobileTabBar` (`className="lg:hidden"`) só quando `mobileTabBar` for `true`.
3. `TooltipProvider` (primitivo) envolve tudo (necessário para o `ComingSoon`).
4. `Toaster` (de `@/components/ui/sonner`): `position={isDesktop ? 'bottom-right' : 'bottom-center'}`; `offset` e `mobileOffset` com `{ bottom }`: **24** px, ou `MOBILE_TAB_BAR_HEIGHT + 16` quando for mobile **e** a barra inferior estiver visível (o toast não pode ficar atrás dela). Não alterar `sonner.tsx`: as props sobrescrevem o `bottom-center` fixo do primitivo.
5. Não mostrar nada de login/sessão além do que o `Header` pede (o banner de expiração é da fase 05). Sem `console.log`.
6. Fechamento: `npx prettier --write src/components/layout/AppShell.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/AppShell.tsx` e `git commit -m "04-030: AppShell"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `AppShell`.
- [ ] Landmarks: um `banner`, um `main`, um `contentinfo` (desktop) e a `navigation` da barra inferior (mobile); nunca dois `main`.
- [ ] Tab: o primeiro foco é "Pular para o conteúdo"; Enter leva o foco ao `main`.
- [ ] Desktop: cabeçalho e rodapé; mobile: nenhum dos dois; barra inferior só onde a rota pede.
- [ ] `Toaster` embaixo à direita em ≥ 1024 px e embaixo ao centro abaixo disso, acima da barra inferior quando ela existe.
- [ ] Sem rolagem horizontal em nenhuma largura de 320 a 1440 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Depois do 04-032 (que liga o `AppShell` à rota raiz): testes do 04-033 e capturas em 1440×900 e 414×896 sobrepostas a `desktop-perfil.png` e `mobile-inicio.png`.
