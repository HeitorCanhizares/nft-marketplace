# 07-003 — Mock: `GET /nfts/:id/reviews`

**Status:** pendente
**Fluxo / subitem:** Detalhes › 7 (avaliações)
**Depende de:** 06-068

## Objetivo
Registrar a listagem paginada de avaliações do NFT.

## Arquivos
- criar: `src/mocks/handlers/reviews.ts`
- alterar: `src/mocks/browser.ts` (registrar em `resourceHandlers`)

## Referências
- docs/api-mock/contratos.md (`GET /nfts/:id/reviews`, `page`, `Paginated<Review>`)
- `src/mocks/db/stores.ts` (`reviewsStore.getByNftId`, `nftsStore`), `src/mocks/handlers/nfts.ts` (estilo de `withMock` e `apiError`)

## Instruções
1. Exportar `reviewsHandlers` com `http.get(apiPath('/nfts/:id/reviews'), withMock('GET /nfts/:id/reviews', …))`.
2. NFT inexistente → `NOT_FOUND`. `page` ausente = 1; inteiro ≥ 1; inválido → `VALIDATION_ERROR` com `fields: { page: … }`.
3. Ordem: `createdAt` decrescente (empate por `id`). **Tamanho de página fixo: 5** (constante local; `pageSize` é ignorado). `totalPages = ceil(total / 5)`; página além do fim → `items: []`.
4. Registrar `...reviewsHandlers` no `browser.ts`.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-003: handler de avaliações`.

## Critérios de aceite
- [ ] Sem `any`; `emerald-ape-042` (19 avaliações): página 1 com 5, `total` 19, `totalPages` 4; valida em `reviewPageSchema`.
- [ ] `page=0` → `422`; id inexistente → `404`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; conferência por `fetch` no navegador.
