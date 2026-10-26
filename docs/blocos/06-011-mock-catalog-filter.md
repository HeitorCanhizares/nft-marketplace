# 06-011 — Mock: filtros do catálogo (busca, aba, coleção, rede, preço, favoritos)

**Status:** concluído
**Fluxo / subitem:** Início › 4, 6, 7, 9
**Depende de:** 06-008, 06-010
**Depende de decisão:** pergunta 2 do relatório da fase 06 ("novos" e "em alta")

## Objetivo
Criar a função que aplica os filtros de `GET /nfts` a uma lista de NFTs, podendo ignorar um grupo (usado pelas contagens dos filtros).

## Arquivos
- criar: `src/mocks/db/catalogFilter.ts`

## Referências
- docs/fluxos/inicio.md (subitens 4, 6, 7, 9) e docs/api-mock/contratos.md (`tab`: `new` = últimos 30 dias, `trending` = mais vendidos e favoritados em 7 dias; `favorites=1`)
- `src/mocks/db/catalogParams.ts` (`CatalogQuery`), `src/mocks/db/db.ts` (`NftRecord`, `stats`, `createdAt`), `src/mocks/db/money.ts` (`ethToUnits`)

## Instruções
1. `normalizeText(text: string): string`: minúsculas, `normalize('NFD')`, remove marcas diacríticas e espaços repetidos (busca sem acento e sem diferenciar caixa).
2. `buildCatalogContext(all: NftRecord[], favoriteIds: ReadonlySet<string> | null): CatalogContext` com:
   - `referenceMs`: o **maior `createdAt`** do catálogo (o seed é fixo em 2026-10-25; usar a data de hoje esvaziaria "Novos" com o tempo); `0` se não houver NFTs;
   - `trendingIds`: ids dos **48** NFTs com maior `stats.sales7d + stats.favorites7d` (empate → id em ordem alfabética);
   - `favoriteIds` (ou `null` para visitante).
3. `applyFilters(nfts: NftRecord[], query: CatalogQuery, context: CatalogContext, skip?: 'collection' | 'network' | 'price'): NftRecord[]` — todos os filtros ativos, exceto o grupo em `skip`:
   - `q`: todas as palavras (separadas por espaço, normalizadas) aparecem em `name`, `tokenId` (com e sem `#`), `collection.name` ou nos `attributes`;
   - `tab`: `new` → `createdAt >= referenceMs − 30 dias`; `trending` → `trendingIds.has(id)`;
   - `collection`, `network`: igualdade; `price`: `minUnits ≤ ethToUnits(nft.price) ≤ maxUnits` (limites ausentes ignorados);
   - `favorites`: só os de `context.favoriteIds` (a validação de login é do handler).
4. Sem `msw`: funções puras, sem alterar a lista recebida. Exportar `normalizeText`, `buildCatalogContext`, `applyFilters` e o tipo `CatalogContext`.
5. Fechamento: `npx prettier --write src/mocks/db/catalogFilter.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/catalogFilter.ts` e `git commit -m "06-011: filtros do catálogo no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `q=musica` acha a coleção "Música"; `q=#0042` e `q=0042` acham o NFT `#0042`.
- [ ] Com o seed: `tab=new` → 39 NFTs; `tab=trending` → 48; filtros combinados reduzem o conjunto (interseção).
- [ ] `skip: 'collection'` ignora só a coleção.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.
