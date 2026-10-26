# 06-009 — Mock: do registro do banco para o `NftSummary`

**Status:** pendente
**Fluxo / subitem:** Início › 8 (card: esgotado, edição do preço, favorito)
**Depende de:** 06-002, 06-008, 02-009

## Objetivo
Criar a função que monta o `NftSummary` da API a partir do registro do banco (`NftRecord`), calculando `soldOut`, `defaultEditionId` e `isFavorite`, para todos os handlers usarem a mesma regra.

## Arquivos
- criar: `src/mocks/db/nftSummary.ts`

## Referências
- docs/api-mock/contratos.md (`NftSummary`: `price` = menor preço entre as edições disponíveis; `isFavorite` só quando logado)
- `src/mocks/db/db.ts` (`NftRecord`), `src/mocks/db/money.ts` (`ethToUnits`), `src/mocks/realtime/scheduler.ts` (o agendador mantém `nft.price` e `previousPrice` coerentes com as edições)

## Instruções
1. `toNftSummary(record: NftRecord, favoriteIds?: ReadonlySet<string>): NftSummary`: monta o objeto **campo a campo** (`id`, `name`, `tokenId`, `image`, `price`, `previousPrice` e `rarity` só se existirem, `collection`, `network`), sem `createdAt`, `stats`, `editions`, `images` etc.
2. `soldOut`: `true` quando há edições e **todas** têm `available === 0` (edição `null` = ilimitada, nunca esgota). Sempre presente (`true` ou `false`).
3. `defaultEditionId`: id da edição com **menor preço** (comparar com `ethToUnits`) entre as vendáveis (`available === null` ou `> 0`); empate → a primeira da lista; **omitir** a chave se `soldOut`.
4. `isFavorite`: só quando `favoriteIds` foi passado (`favoriteIds.has(record.id)`); sem o parâmetro, **omitir** a chave (visitante).
5. Sem React, sem `msw`. Exportar só `toNftSummary`.
6. Fechamento: `npx prettier --write src/mocks/db/nftSummary.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/nftSummary.ts` e `git commit -m "06-009: NftSummary no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a resposta valida em `nftSummarySchema` e **não** tem `stats`, `createdAt` nem `editions`.
- [ ] NFT com todas as edições em 0 → `soldOut: true` e sem `defaultEditionId`; com uma edição `ABERTA` (`null`) → `soldOut: false`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.
