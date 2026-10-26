# 06-012 — Mock: as 5 ordenações do catálogo

**Status:** concluído
**Fluxo / subitem:** Início › 5 (ordenação)
**Depende de:** 06-008, 06-010

## Objetivo
Criar a função que ordena a lista de NFTs conforme `sort`, de forma estável e previsível.

## Arquivos
- criar: `src/mocks/db/catalogSort.ts`

## Referências
- docs/fluxos/inicio.md (subitem 5) e docs/api-mock/contratos.md (`sort` = `recent` | `price_asc` | `price_desc` | `top_rated` | `most_favorited`)
- `src/mocks/db/catalogParams.ts` (`CatalogQuery['sort']`), `src/mocks/db/db.ts` (`NftRecord`), `src/mocks/db/money.ts` (`ethToUnits`)

## Instruções
1. `sortNfts(nfts: NftRecord[], sort: CatalogQuery['sort'], favoriteCounts: ReadonlyMap<string, number>): NftRecord[]` — devolve uma **cópia** ordenada. **Desempate sempre por `id` em ordem alfabética**, para a ordem ser determinística:
   - `recent`: `createdAt` mais novo primeiro;
   - `price_asc` / `price_desc`: `ethToUnits(nft.price)`;
   - `top_rated`: `rating.average` maior primeiro, depois `rating.count` maior;
   - `most_favorited`: `favoriteCounts.get(id) ?? 0` maior primeiro (o handler monta o mapa com `stats.favoritesTotal` + os favoritos reais do banco).
2. Sem `msw`, funções puras. Fechamento: `npx prettier --write src/mocks/db/catalogSort.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/catalogSort.ts` e `git commit -m "06-012: ordenações do catálogo no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a lista original não é alterada.
- [ ] `recent` com o seed devolve primeiro Emerald Ape #042, Sage Nomad #009, Neon Vessel #552 (a ordem da primeira página do Figma).
- [ ] Duas chamadas com a mesma entrada dão a mesma ordem, inclusive com empates.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.
