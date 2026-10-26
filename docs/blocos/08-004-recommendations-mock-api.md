# 08-004 — `GET /nfts/recommendations` (mock, serviço e chave)

**Status:** concluído
**Fluxo / subitem:** Carrinho › 10 (recomendações no desktop)
**Depende de:** 08-001

## Objetivo
Endpoint de recomendações no mock e o serviço do front.

## Arquivos
- alterar: `src/mocks/handlers/nfts.ts`
- alterar: `src/services/api/nfts.ts`
- alterar: `src/hooks/queryKeys.ts`

## Referências
- docs/api-mock/contratos.md (`GET /nfts/recommendations` → `NftSummary[]`; **registrar antes de `/nfts/:id`**)
- `src/mocks/handlers/nfts.ts` (comentário "Registrar /nfts/recommendations … antes de /nfts/:id"; `/nfts/:id/related` como modelo; `readFavoriteIds`), `src/mocks/db/catalogFilter.ts` (ranking `sales7d + favorites7d`), `getRelatedNfts` em `services/api/nfts.ts`

## Instruções
1. **Regra proposta (confirmar):** os **10 NFTs mais vendidos e favoritados em 7 dias** (`stats.sales7d + stats.favorites7d`, desempate pela ordem do seed), **não esgotados**, sem olhar o carrinho. O front tira os que já estão no carrinho (08-005).
2. `handlers/nfts.ts`: `http.get(apiPath('/nfts/recommendations'), withMock('GET /nfts/recommendations', …))` **antes** do `http.get('/nfts/:id')` (apagar o comentário-lembrete). Resposta `toNftSummary(item, favoriteIds)[]`, mesma forma do `/related` (com `isFavorite` quando logado).
3. `services/api/nfts.ts`: `getRecommendedNfts(signal?): Promise<NftSummary[]>` validando com o schema de lista de `NftSummary` (como `getRelatedNfts`).
4. `queryKeys.ts`: `nfts.recommendations: ['nfts', 'related', 'recommendations'] as const` — **dentro do prefixo `nfts.relatedAll`** de propósito: assim o `useToggleFavorite` (que atualiza `relatedAll`) também atualiza o coração dos cards recomendados, sem mexer nele.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-004: recomendações`.

## Critérios de aceite
- [ ] `GET /nfts/recommendations` devolve 10 itens (não `404`, não o handler `:id`); nenhum com `soldOut`.
- [ ] `GET /nfts/emerald-ape-042` e `/nfts/:id/related` continuam funcionando.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Coberto no spec do 08-013.
