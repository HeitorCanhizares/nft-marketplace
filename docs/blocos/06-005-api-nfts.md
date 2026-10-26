# 06-005 — Serviço de API: início e catálogo

**Status:** pendente
**Fluxo / subitem:** Início › 3 a 7, 9 (parâmetros enviados à API)
**Depende de:** 06-003, 03-003, 03-007, 03-008
**Depende de decisão:** pergunta 4 do relatório da fase 06 ("Carregar mais" por `pageSize` acumulado)

## Objetivo
Criar `getHome` e `getCatalog` e o mapeamento da URL em PT-BR para os parâmetros da API.

## Arquivos
- criar: `src/services/api/nfts.ts`

## Referências
- docs/api-mock/contratos.md (`GET /home`, `GET /nfts`; "O mapeamento dos valores da URL em PT-BR para estes fica em `services/api/nfts.ts`")
- `src/services/http/validate.ts` (`get(url, schema, { params, signal })`), `src/schemas/nft.ts` (`homeResponseSchema`, `catalogResponseSchema`), `src/services/api/auth.ts` (padrão do arquivo)

## Instruções
1. `toCatalogParams(search: HomeSearch, isDesktop: boolean): CatalogApiParams`:
   - `q` → `q`; `colecao` → `collection`; `rede` → `network`; `favoritos` → `favorites: 1`;
   - `aba`: `novos` → `new`, `em-alta` → `trending`, `todos`/ausente → **não envia**;
   - `ordem`: `menor-preco` → `price_asc`, `maior-preco` → `price_desc`, `mais-avaliados` → `top_rated`, `mais-favoritados` → `most_favorited`, `recentes`/ausente → **não envia**;
   - `precoMin`/`precoMax` (number do controle) → `minPrice`/`maxPrice` como **string com 2 casas** (`toFixed(2)`);
   - **desktop:** `page = pagina ?? 1`, `pageSize = 9`; **mobile:** `page = 1`, `pageSize = 9 × (pagina ?? 1)` (as páginas carregadas até agora, numa resposta só);
   - não incluir chaves `undefined` no objeto.
2. `getCatalog(params: CatalogApiParams, signal?: AbortSignal): Promise<CatalogResponse>` → `get('/nfts', catalogResponseSchema, { params, signal })`.
3. `getHome(signal?: AbortSignal): Promise<HomeResponse>` → `get('/home', homeResponseSchema, { signal })`.
4. Sem React, sem importar de `mocks/`. Exports nomeados.
5. Fechamento: `npx prettier --write src/services/api/nfts.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/api/nfts.ts` e `git commit -m "06-005: serviço de API do catálogo"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] `toCatalogParams({}, true)` → `{ page: 1, pageSize: 9 }`; `toCatalogParams({ pagina: 3 }, false)` → `{ page: 1, pageSize: 27 }`; `{ aba: 'novos', ordem: 'menor-preco', precoMin: 0.5 }` → `tab: 'new'`, `sort: 'price_asc'`, `minPrice: '0.50'`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061 (parâmetros reais na requisição).
