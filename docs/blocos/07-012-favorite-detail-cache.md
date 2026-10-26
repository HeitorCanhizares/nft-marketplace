# 07-012 — Favorito do detalhe: cache otimista e ação pendente

**Status:** concluído
**Fluxo / subitem:** Detalhes › 5 (favoritar, persistir, login e volta)
**Depende de:** 07-004

## Objetivo
Fazer o favorito atualizar também o cache do detalhe e dos relacionados, e concluir a ação pendente na volta do login.

## Arquivos
- alterar: `src/hooks/useToggleFavorite.ts`
- alterar: `src/hooks/usePendingExecutors.ts`

## Referências
- docs/fluxos/detalhes-nft.md (subitem 5); docs/arquitetura/estado.md (otimista, trava por `isMutating`)
- `src/hooks/queryKeys.ts` (`nfts.details`, `nfts.relatedAll` do 07-004)

## Instruções
1. `useToggleFavorite`: em `onMutate`, também `cancelQueries` e `setQueriesData` em `nfts.details` (objeto `NftDetail`: trocar `isFavorite` se `id` bate) e em `nfts.relatedAll` (array `NftSummary[]`). Incluir ambos no `Snapshot` e restaurá-los em `onError`. Não mudar a trava síncrona, o redirecionamento do visitante (`/entrar?redirect=` com a rota atual) nem os toasts.
2. `usePendingExecutors`: no executor `favorite`, invalidar também `nfts.details` e `nfts.relatedAll`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-012: favorito no cache do detalhe`.

## Critérios de aceite
- [ ] Sem `any`; Início e cards continuam atualizando como antes.
- [ ] Erro na mutação desfaz também o detalhe e os relacionados.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; `npm run test:e2e -- favorites-cart-mock` verde.
