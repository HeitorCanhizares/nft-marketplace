# 06-026 — Executor da ação pendente "favoritar"

**Status:** pendente
**Fluxo / subitem:** Início › 8 ("sem login leva a `/entrar?redirect=` e conclui a ação na volta") e Login › 4
**Depende de:** 06-006, 06-024, 06-023, 05-026, 05-027, 04-030

## Objetivo
Registrar, no app inteiro, o executor que conclui o favorito guardado antes do login (a fase 05 deixou o mecanismo sem executores).

## Arquivos
- criar: `src/hooks/usePendingExecutors.ts`
- alterar: `src/components/layout/AppShell.tsx`

## Referências
- `src/lib/pendingAction.ts` (`registerPendingExecutor(type, executor): () => void`; o executor faz a mutation e **devolve a mensagem**; `runPendingAction` roda uma vez e é chamado pelo `useAuthSuccess`, que mostra o toast) e docs/blocos/05-026
- `src/hooks/queryKeys.ts` (`nfts.lists`, `home`, `favorites`), `src/app/queryClient.ts`, `src/services/api/favorites.ts`

## Instruções
1. `usePendingExecutors()`: um `useEffect` (dependências vazias) que chama `registerPendingExecutor('favorite', async ({ nftId }) => { await addFavorite(nftId); await Promise.all([queryClient.invalidateQueries({ queryKey: nfts.lists }), queryClient.invalidateQueries({ queryKey: home }), queryClient.invalidateQueries({ queryKey: favorites })]); return 'Adicionado aos favoritos.' })` e **devolve** a função de desfazer o registro (`StrictMode` monta duas vezes). Importa o `queryClient` de `@/app/queryClient`.
2. Por que invalidar as listas: as listas guardadas em cache são de visitante (sem `isFavorite`); depois do login precisam ser refeitas com o token.
3. `AppShell.tsx`: chamar `usePendingExecutors()` no topo do componente, junto de `useRouteFocus()`. Mais nada muda.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/usePendingExecutors.ts src/components/layout/AppShell.tsx` e `git commit -m "06-026: executor de favoritar pendente"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; o registro é desfeito ao desmontar.
- [ ] Depois do login, a ação roda **uma vez** e a mensagem aparece no toast ("Adicionado aos favoritos."); falha da API vira o toast de erro padrão do `useAuthSuccess`.
- [ ] Os testes de ação pendente da fase 05 (05-045, que registram um executor próprio pela ponte) continuam verdes.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- session layout` verde. Coberto no 06-063.
