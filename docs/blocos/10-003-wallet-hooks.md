# 10-003 — Hooks de carteiras (consulta e envios)

**Status:** pendente
**Fluxo / subitem:** Carteiras › 2, 3, 4, 5, 7
**Depende de:** 10-001

## Objetivo
`useWallets` (consulta) e as quatro mutações (salvar principal, salvar secundária, remover secundária, trocar), cada uma com trava de clique repetido e invalidação da query `wallets`.

## Arquivos
- criar: `src/hooks/useWallets.ts`

## Referências
- Padrão: `src/hooks/useProfile.ts` (`useUpdateProfile`: `mutationKey`, `inFlight` em `useRef` só fora do render, `queryClient.isMutating`)
- `wallets` e `PRIVATE_QUERY_ROOTS` em `src/hooks/queryKeys.ts`; serviço do 10-001
- `useLiveAnnouncer` (`src/contexts/liveAnnouncer`), `toast` (`sonner`), como em `useProfileSave.ts`

## Instruções
1. `useWallets()` → `useQuery({ queryKey: wallets, queryFn: ({ signal }) => getWallets(signal) })`.
2. `useWalletMutations()` devolve `{ savePrimary, saveSecondary, removeSecondary, swap, isPending }`. Cada função é `async` e **não** trata erro (quem chama trata; o hook só repassa a rejeição). Cada mutação:
   - tem `mutationKey` próprio (`['save-primary-wallet']`, `['save-secondary-wallet']`, `['remove-secondary-wallet']`, `['swap-wallets']`);
   - **trava de clique repetido**: se `queryClient.isMutating({ mutationKey })` > 0 e há promessa em andamento (guardada em `useRef`, atribuída só dentro da função, nunca lida no render), devolve a mesma promessa;
   - `onSuccess`: `queryClient.invalidateQueries({ queryKey: wallets })` **e** `setQueryData(wallets, …)` com o resultado local (principal/secundária salva; `{ primary, secondary: null }` ao remover; o par trocado no `swap`), para a tela refletir sem esperar o refetch.
   - Anúncio (`announce`, `polite`) e `toast.success`: "Carteira principal salva", "Carteira secundária salva", "Carteira secundária removida", "Carteiras trocadas".
3. `isPending`: verdadeiro se qualquer uma das quatro estiver em andamento.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-003: hooks de carteiras`.

## Critérios de aceite
- [ ] Dois cliques seguidos em "salvar": uma só requisição.
- [ ] Depois de salvar, remover ou trocar, a query `wallets` fica atualizada (o Pagamento da fase 11 lê a mesma query).
- [ ] Nenhum `ref` lido no render; sem `any`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 10-010.
