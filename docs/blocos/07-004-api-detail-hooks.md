# 07-004 — Serviço e hooks de dados do detalhe

**Status:** concluído
**Fluxo / subitem:** Detalhes › 2, 8, 12 (carregar NFT, relacionados, acesso direto)
**Depende de:** 07-002, 07-003

## Objetivo
Funções HTTP validadas, chaves de cache e hooks de leitura do NFT e dos relacionados.

## Arquivos
- alterar: `src/services/api/nfts.ts`
- alterar: `src/hooks/queryKeys.ts`
- criar: `src/hooks/useNftDetail.ts`

## Referências
- docs/arquitetura/estado.md (chaves, retry, `signal`); `src/schemas/nft.ts` (`nftDetailSchema`, `nftSummarySchema`, `reviewPageSchema`)
- `src/hooks/useCart.ts` (padrão de reagir à mudança de `status` de autenticação)

## Instruções
1. `services/api/nfts.ts`: `getNft(id, signal?)` → `NftDetail`; `getRelatedNfts(id, signal?)` → `NftSummary[]` (`z.array(nftSummarySchema)`); `getReviews(id, page, signal?)` → `Paginated<Review>`. Todas via `get` de `validate.ts`.
2. `queryKeys.ts`: em `nfts`, acrescentar `details: ['nfts','detail'] as const` e `relatedAll: ['nfts','related'] as const` (prefixos das chaves existentes).
3. `useNftDetail.ts`: exportar `nftDetailOptions(id)` (`queryOptions` com `nfts.detail(id)`, `queryFn` com `signal`); `useNftDetail(id)` (`useQuery` + `useEffect` que, quando `useAuth().status` muda (exceto a partir de `loading`), invalida `nfts.detail(id)` para trazer o `isFavorite` correto); `useRelatedNfts(id)` (`nfts.related(id)`).
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-004: serviço e hooks do detalhe`.

## Critérios de aceite
- [ ] Sem `any`; 404 chega como `ApiError` com `status` 404 e **não** é repetido (regra de retry).
- [ ] Nenhuma chave de cache escrita à mão fora de `queryKeys.ts`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build.
