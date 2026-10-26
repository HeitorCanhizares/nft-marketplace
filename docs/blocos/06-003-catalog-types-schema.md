# 06-003 — Tipos e validação dos parâmetros da Início

**Status:** concluído
**Fluxo / subitem:** Início › 3 a 7, 9 (estado na URL)
**Depende de:** 06-002, 03-002, 03-003
**Depende de decisão:** perguntas 11 e 17 do relatório da fase 06 (limites e normalização)

## Objetivo
Definir os tipos da busca da Início, o tipo da resposta do catálogo e a função de validação que o `validateSearch` da rota `/` vai usar.

## Arquivos
- criar: `src/types/catalog.ts`
- criar: `src/schemas/catalog.ts`

## Referências
- docs/arquitetura/rotas.md (tabela de parâmetros de `/` e **armadilha do `validateSearch`**: devolver **sempre** todas as chaves conhecidas, com `undefined` quando inválidas)
- docs/api-mock/contratos.md (`GET /nfts`), `src/schemas/nft.ts` (`catalogResponseSchema`), `src/schemas/common.ts` (`networkSchema`)
- `src/routes/index.tsx` (o `validateSearch` provisório que este bloco substitui na 06-057)

## Instruções
1. `types/catalog.ts` (só tipos, sem import de React):
   - `CatalogTab = 'todos' | 'novos' | 'em-alta'`; `CatalogSort = 'recentes' | 'menor-preco' | 'maior-preco' | 'mais-avaliados' | 'mais-favoritados'`;
   - `HomeSearch = { q?: string; aba?: CatalogTab; colecao?: string; rede?: Network; precoMin?: number; precoMax?: number; ordem?: CatalogSort; pagina?: number; favoritos?: 1 }`;
   - `CatalogResponse = Paginated<NftSummary> & { facets: CatalogFacets }`;
   - `CatalogApiParams = { q?: string; tab?: 'new' | 'trending'; collection?: string; network?: Network; minPrice?: string; maxPrice?: string; sort?: 'price_asc' | 'price_desc' | 'top_rated' | 'most_favorited'; page: number; pageSize: number; favorites?: 1 }` (o padrão, aba `all` e ordem `recent`, **não** é enviado).
2. `schemas/catalog.ts`: `validateHomeSearch(search: Record<string, unknown>): HomeSearch`, com zod por chave e `.catch(undefined)`:
   - **o roteador entrega valores já convertidos** (`?q=123` chega como número, `?pagina=2` como `2`, `?favoritos=1` como `1`): aceitar string **ou** número em `q` e `colecao` (convertendo para string) e string ou número em `precoMin`/`precoMax`/`pagina`;
   - `q`: `trim`, máximo 100 caracteres, vazio → `undefined`;
   - `aba` e `ordem`: só os valores do tipo; o **padrão** (`todos`, `recentes`) vira `undefined` (URL limpa);
   - `colecao`: id não vazio de até 60 caracteres; `rede`: `networkSchema`;
   - `precoMin`/`precoMax`: número finito ≥ 0, arredondado a 2 casas; se `precoMin > precoMax`, **os dois** viram `undefined`;
   - `pagina`: inteiro ≥ 1 (e ≤ 1000); `1` vira `undefined`; `favoritos`: `1` ou `'1'` → `1`, senão `undefined`.
   - O retorno **sempre contém as 9 chaves** (valor ou `undefined`).
3. Exportar também `hasActiveFilters(search: HomeSearch): boolean` (verdadeiro com `q`, `colecao`, `rede`, `precoMin` ou `precoMax`; **não** conta `aba`, `ordem`, `pagina` nem `favoritos`).
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/types/catalog.ts src/schemas/catalog.ts` e `git commit -m "06-003: tipos e validação da busca da Início"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `validateHomeSearch({})` devolve as 9 chaves `undefined`.
- [ ] `validateHomeSearch({ pagina: '2', aba: 'novos', q: 123 })` → `{ pagina: 2, aba: 'novos', q: '123', … }`; `{ pagina: 0 }`, `{ aba: 'x' }`, `{ precoMin: 5, precoMax: 1 }` → chaves `undefined`.
- [ ] Nenhuma chave inválida "vaza" (a armadilha do roteador).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 06-061 (via `window.__kurio.catalog`, exposto no 06-059).
