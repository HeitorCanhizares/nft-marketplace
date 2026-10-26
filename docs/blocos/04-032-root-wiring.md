# 04-032 — Ligar o AppShell e os fallbacks ao router

**Status:** pendente (**`scrollRestoration`: pergunta 14**)
**Fluxo / subitem:** Fase 04 › Layout
**Depende de:** 04-030, 04-031

## Objetivo
Fazer a rota raiz usar o `AppShell` e registrar 404, erro e carregamento padrão no router.

## Arquivos
- alterar: `src/routes/__root.tsx`, `src/app/router.tsx`

## Referências
- docs/arquitetura/rotas.md (`__root.tsx` = `AppShell`; `notFoundComponent`, `errorComponent`, `pendingComponent`; `defaultPreload: 'intent'`)
- `src/routes/__root.tsx` (hoje só `<Outlet />`)

## Instruções
1. `__root.tsx`: `createRootRoute({ component: AppShell })`. O `AppShell` já renderiza o `Outlet`.
2. `router.tsx`: manter `routeTree`, `defaultPreload: 'intent'`, o `declare module` com `Register` e o `StaticDataRouteOption` do 04-006. Acrescentar em `createRouter`: `defaultNotFoundComponent: RouteNotFound`, `defaultErrorComponent: RouteError`, `defaultPendingComponent: RoutePending` e `scrollRestoration: true` (voltar/avançar do navegador restaura a rolagem). Não mexer no `defaultPendingMs` (padrão do roteador: evita piscar skeleton em carregamento curto).
3. `npx vite build` e conferir que `src/routeTree.gen.ts` **não** mudou.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` (a fumaça da fase 00 e os testes das fases 02 e 03 continuam passando). Commit: `git add src/routes/__root.tsx src/app/router.tsx` e `git commit -m "04-032: AppShell e fallbacks no router"`.

## Critérios de aceite
- [ ] `npm run dev`: `/` mostra o cabeçalho (desktop) ou a barra inferior (mobile) e o `<h1>Kurio</h1>`.
- [ ] `/rota-que-nao-existe` mostra a 404 dentro do `AppShell`, com o foco no `<h1>` depois de navegar até ela por um link.
- [ ] `npm run test:e2e` continua verde (teste de fumaça: título "Kurio", `<h1>` "Kurio", axe sem violações graves).
- [ ] O build de produção não contém `__kurio` (conferir com `grep -r __kurio dist/`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` verde.
- Capturas de `/` em 1440×900 e 414×896 comparadas com os topos de `desktop-inicio.png` e `mobile-inicio.png` (a barra inferior e o cabeçalho já aparecem; o conteúdo ainda é placeholder).

## Nota do Opus (2026-10-26, achado na verificação do 04-031)
O `pendingComponent` do `__root` só cobre o carregamento do próprio root. Para as rotas filhas, registrar `RoutePending` como **`defaultPendingComponent`** no `createRouter` (e, por coerência, `defaultNotFoundComponent` e `defaultErrorComponent`). Incluir também `viewport-fit=cover` no `<meta name="viewport">` do `index.html`, para o `env(safe-area-inset-bottom)` da `MobileTabBar` funcionar em iPhones com notch, e conferir que o `nav` oculto (Header ou MobileTabBar, conforme o breakpoint) não fica na árvore de acessibilidade.
