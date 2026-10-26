# 07-002 — Mock: `GET /nfts/:id` e `GET /nfts/:id/related`

**Status:** concluído
**Fluxo / subitem:** Detalhes › 2, 8, 12 (informações, relacionados, 404)
**Depende de:** 06-068

## Objetivo
Registrar os dois handlers de detalhe e relacionados no `nftsHandlers`.

## Arquivos
- criar: `src/mocks/db/nftDetail.ts`
- alterar: `src/mocks/handlers/nfts.ts`

## Referências
- docs/api-mock/contratos.md (NFTs: `NftDetail`, `404 NOT_FOUND`, `related`)
- `src/mocks/db/nftSummary.ts` (`toNftSummary`), `src/types/nft.ts` (`NftDetail`), `src/mocks/db/db.ts` (`NftRecord`)
- O `GET /nfts` do mesmo arquivo (identificação do usuário por `tryAuthenticate` e `favoriteIds`)

## Instruções
1. `nftDetail.ts`: `toNftDetail(record, favoriteIds?)` = `toNftSummary(record, favoriteIds)` mais `description`, `images`, `editions`, `attributes`, `rating`, `details`, copiados campo a campo (sem `createdAt` nem `stats`).
2. `GET /nfts/:id` (`withMock('GET /nfts/:id', …)`): `tryAuthenticate` → `favoriteIds` como no `GET /nfts`; NFT inexistente → `apiError('NOT_FOUND')`; senão `HttpResponse.json(toNftDetail(...))`.
3. `GET /nfts/:id/related`: `404` se o NFT não existe; senão os NFTs da **mesma coleção**, exceto ele mesmo, na ordem do seed, **no máximo 10**, via `toNftSummary` com `favoriteIds`.
4. Registrar as duas rotas **depois** de `/nfts` (o `/nfts/recommendations` da fase 08 deverá ser registrado antes de `/nfts/:id`; comentar isso no código).
5. Fechamento: prettier nos arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-002: handlers de detalhe e relacionados`.

## Critérios de aceite
- [ ] Sem `any`; `GET /nfts/emerald-ape-042` devolve as 4 edições e valida em `nftDetailSchema`; sem token, sem `isFavorite`; com token, com `isFavorite`.
- [ ] Id inexistente → `404 NOT_FOUND` (detalhe e related); related não contém o próprio NFT e tem no máximo 10.
- [ ] `server-error:GET /nfts/:id` → `500`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; conferência por `fetch` no navegador (coberto no 07-017).
