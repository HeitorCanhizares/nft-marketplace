# 06-013 — Mock: `facets` do catálogo (contagens e faixa de preço)

**Status:** pendente
**Fluxo / subitem:** Início › 6 (filtros com contagem e limites do preço)
**Depende de:** 06-010, 06-011
**Depende de decisão:** pergunta 3 do relatório da fase 06 (como as contagens e a faixa são calculadas)

## Objetivo
Montar `facets` (`collections`, `networks`, `priceRange`) para a resposta de `GET /nfts`.

## Arquivos
- criar: `src/mocks/db/catalogFacets.ts`

## Referências
- docs/api-mock/contratos.md (`facets: { collections: {id,name,count}[], networks: {id,name,count}[], priceRange: {min,max} }`) e docs/fluxos/inicio.md (subitem 6)
- `src/mocks/db/catalogFilter.ts` (`applyFilters` com `skip`), `src/mocks/seed/collections.ts` (`seedCollections`: a **ordem** do Figma), `src/mocks/db/money.ts` (`ethToUnits`, `unitsToEth`), `src/types/nft.ts` (`CatalogFacets`)

## Instruções
1. `buildFacets(all: NftRecord[], query: CatalogQuery, context: CatalogContext): CatalogFacets`:
   - **`collections`:** uma entrada para **cada** coleção de `seedCollections`, **na ordem do seed** (Arte digital, Fotografia, Música, Arte 3D, Colecionáveis, Generativa, Jogos, Assinaturas, Utilidade; `collectionsStore.getAll` devolve por id e **não** serve), com `count` = quantos NFTs passam em `applyFilters(all, query, context, 'collection')` (todos os filtros **menos o da própria coleção**) e pertencem a ela; coleção sem NFT → `count: 0`;
   - **`networks`:** `ethereum` "Ethereum", `polygon` "Polygon", `solana` "Solana" (nessa ordem), contagem com `skip: 'network'`;
   - **`priceRange`:** menor e maior `price` do catálogo **inteiro** (`all`, **sem** filtros, para os limites do controle não se mexerem quando o usuário filtra), via `ethToUnits`/`unitsToEth`; `all` vazio → `{ min: '0.00', max: '0.00' }`.
2. Sem `msw`, função pura. Fechamento: `npx prettier --write src/mocks/db/catalogFacets.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/catalogFacets.ts` e `git commit -m "06-013: facets do catálogo no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a resposta valida em `catalogFacetsSchema`.
- [ ] Sem filtros: a soma das contagens de coleções = 283 e a de redes = 283 (com o seed: 39, 14, 77, 46, 27, 20, 23, 16, 21 e 119, 78, 86).
- [ ] Com `network=ethereum`: as coleções somam 119 e as **redes** continuam 119, 78, 86 (o grupo da rede se ignora).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.
