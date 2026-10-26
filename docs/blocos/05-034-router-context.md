# 05-034 — Contexto do roteador e `AppRouter`

**Status:** concluído
**Fluxo / subitem:** Login › 5 e 8 (o roteador conhece a sessão e reavalia as guardas quando ela muda)
**Depende de:** 04-032, 05-033
**Depende de decisão:** pergunta 1 do relatório da fase 05

## Objetivo
Passar o `AuthContext` ao roteador como contexto e criar o `AppRouter`, que renderiza o `RouterProvider` com a sessão atual e chama `router.invalidate()` quando o status muda (login, logout, expiração, fim da recuperação).

## Arquivos
- alterar: `src/routes/__root.tsx`, `src/app/router.tsx`
- criar: `src/app/AppRouter.tsx`

## Referências
- docs/arquitetura/rotas.md (Proteção de rotas) e a documentação do TanStack Router sobre contexto do roteador e `router.invalidate()` (conferir os nomes na versão instalada)
- `src/app/routerContext.ts` (05-033), `src/contexts/auth.ts` (`useAuth`), `src/main.tsx`

## Instruções
1. `__root.tsx`: `createRootRouteWithContext<RouterContext>()({ component: AppShell })`.
2. `router.tsx`: `createRouter({ …, context: { auth: undefined as unknown as RouterContext['auth'] } })` com um comentário: "o valor real vem do `AppRouter`; a guarda nunca roda antes dele". Manter tudo o mais (preload, fallbacks, `scrollRestoration`, `Register`, `StaticDataRouteOption`, `HistoryState` do 05-028).
3. `AppRouter.tsx`: `export function AppRouter()` — `const auth = useAuth()`; devolve `<RouterProvider router={router} context={{ auth }} />`; um `useEffect` com `[auth.status]` que chama `void router.invalidate()` **a partir da segunda execução** (guardar o status anterior em `useRef`; na montagem o roteador já carrega sozinho).
4. `main.tsx` ainda **não** muda neste bloco (05-035).
5. `npx vite build` e conferir que `src/routeTree.gen.ts` **não** mudou.
6. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes/__root.tsx src/app/router.tsx src/app/AppRouter.tsx` e `git commit -m "05-034: contexto do roteador e AppRouter"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `useRouteContext`/`beforeLoad` enxergam `context.auth` tipado.
- [ ] `router.invalidate()` roda quando `auth.status` muda e **não** na montagem.
- [ ] O build continua passando (o `main.tsx` antigo compila).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` das fases 00 a 04 verde.
