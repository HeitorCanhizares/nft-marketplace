# 05-035 — `main.tsx` usa o `AppRouter`

**Status:** concluído
**Fluxo / subitem:** Login › 5 e 8
**Depende de:** 05-034

## Objetivo
Trocar o `RouterProvider` do ponto de entrada pelo `AppRouter`, mantendo a ordem de inicialização (MSW, depois o app).

## Arquivos
- alterar: `src/main.tsx`

## Referências
- `src/main.tsx` (o app inteiro entra por `import()` depois de `startMocking()`; **ordem obrigatória**, ver o comentário no arquivo)
- `src/app/AppRouter.tsx` (05-034)

## Instruções
1. No `Promise.all` de imports dinâmicos, trocar `@tanstack/react-router` e `@/app/router` por `import('@/app/AppRouter')`; manter `Providers` e `connectSocket`.
2. Renderizar `<Providers><AppRouter /></Providers>` (sem `RouterProvider` direto). O `StrictMode` e o resto ficam como estão.
3. Fechamento: `npx prettier --write src/main.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` verde. Commit: `git add src/main.tsx` e `git commit -m "05-035: main usa o AppRouter"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `main.tsx` não importa o `router` nem o `RouterProvider`.
- [ ] A inicialização continua na ordem: MSW → app; `window.__kurio` e `window.__kurioMock` existem no build de teste.
- [ ] `grep -r __kurio dist/` continua vazio no build de produção.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` verde; `npm run dev` abre `/` normalmente.
