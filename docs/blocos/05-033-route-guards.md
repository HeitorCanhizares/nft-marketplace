# 05-033 — Guardas de rota (`requireAuth` e `requireGuest`)

**Status:** pendente
**Fluxo / subitem:** Login › 1 e 8 (só deslogado; rotas protegidas → `/entrar?redirect=`)
**Depende de:** 05-002, 05-032
**Depende de decisão:** pergunta 1 do relatório da fase 05

## Objetivo
Criar o tipo do contexto do roteador e as duas funções de `beforeLoad`: `requireAuth` (rota protegida) e `requireGuest` (rota só para deslogado).

## Arquivos
- criar: `src/app/routerContext.ts`, `src/app/routeGuards.ts`

## Referências
- docs/arquitetura/rotas.md (Proteção de rotas: logado sem sessão → `redirect({ to: '/entrar', search: { redirect: location.href } })`; só deslogado com sessão → `redirect` ou `/`)
- docs/fluxos/login.md (subitem 1: usuário já logado em `/entrar` vai para o `redirect` ou `/`; subitem 8: rotas protegidas)
- `src/lib/redirect.ts` (`parseRedirect`), `src/contexts/auth.ts` (`AuthContextValue`, `ready`)

## Instruções
1. `routerContext.ts`: `export type RouterContext = { auth: AuthContextValue }` (só o tipo; fica fora de `router.tsx` para as rotas importarem sem ciclo).
2. `routeGuards.ts` — função interna `settledStatus(auth)`: `auth.status === 'loading' ? await auth.ready : auth.status` (devolve `'authenticated' | 'anonymous'`).
3. `requireAuth({ context, location }: { context: RouterContext; location: { href: string } }): Promise<void>`: se o status resolvido **não** é `'authenticated'`, `throw redirect({ to: '/entrar', search: { redirect: parseRedirect(location.href) }, replace: true })`.
4. `requireGuest({ context, search }: { context: RouterContext; search: { redirect?: string } }): Promise<void>`: se `'authenticated'`, `throw redirect({ href: parseRedirect(search.redirect) ?? '/', replace: true })`.
5. Os dois são usados como `beforeLoad` (05-036 a 05-038). Comentar em uma linha: "o `AppRouter` chama `router.invalidate()` quando o status muda, então estas funções rodam de novo depois do login, do logout e da expiração".
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/routerContext.ts src/app/routeGuards.ts` e `git commit -m "05-033: guardas de rota"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Com `loading`, as guardas **esperam** `ready` (não redirecionam por engano).
- [ ] `requireAuth` anônimo → redirect com `redirect` = caminho completo (busca e hash inclusos); `requireGuest` autenticado → destino seguro (`//evil.com` vira `/`).
- [ ] `replace: true` nos dois (o botão Voltar não volta para a página que redireciona).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-046.
