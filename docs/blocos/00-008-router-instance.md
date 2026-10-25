# 00-008 — Instância do router e RouterProvider

**Status:** pendente
**Fluxo / subitem:** Fase 00 › TanStack Router (rota raiz mínima)
**Depende de:** 00-007

## Objetivo
Criar a instância tipada do router e passar a renderizar o app por ela, de modo que `/` mostre a rota mínima.

## Arquivos
- criar: `src/app/router.tsx`
- alterar: `src/main.tsx`

## Referências
- docs/arquitetura/pastas.md (`app/`: instância do router)
- docs/arquitetura/rotas.md (`defaultPreload: 'intent'`)

## Instruções
1. `src/app/router.tsx`: `createRouter({ routeTree, defaultPreload: 'intent' })` importando `routeTree` de `@/routeTree.gen`; exportar `router`; declarar o módulo `@tanstack/react-router` com `interface Register { router: typeof router }`.
2. `src/main.tsx`: trocar o `<h1>` por `<RouterProvider router={router} />`, mantendo `StrictMode` e o import do CSS.
3. **Não** configurar `notFoundComponent`, `errorComponent`, `pendingComponent`, `context` nem o QueryClient: são das fases 03 e 04.
4. Commit: `git add src/app/router.tsx src/main.tsx` e `git commit -m "00-008: instância do router"`.

## Critérios de aceite
- [ ] `/` mostra `<h1>Kurio</h1>` vindo da rota `index.tsx`.
- [ ] O tipo do router está registrado (links com `to` inválido falham no typecheck).
- [ ] `main.tsx` só tem o setup do React, do CSS e do `RouterProvider`.

## Verificação (Sonnet)
- `npm run typecheck && npm run build` → exit 0.
- Sanidade (não commitada): `<Link to="/nao-existe" />` temporário deve falhar no `npm run typecheck`; reverter.
- `npm run preview` e abrir `/`: h1 "Kurio" visível, console sem erros.
