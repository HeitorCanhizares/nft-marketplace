# 06-010 — Mock: leitura e validação dos parâmetros de `GET /nfts`

**Status:** pendente
**Fluxo / subitem:** Início › 3 a 7 (o que o servidor entende)
**Depende de:** 03-002, 02-007, 02-009
**Depende de decisão:** perguntas 4 e 17 do relatório da fase 06 (`pageSize` até 300; `q` até 100)

## Objetivo
Transformar a query string de `GET /nfts` num objeto tipado, ou devolver os erros por campo (`422 VALIDATION_ERROR`).

## Arquivos
- criar: `src/mocks/db/catalogParams.ts`

## Referências
- docs/api-mock/contratos.md (`GET /nfts`: `q, tab, collection, network, minPrice, maxPrice, sort, page, pageSize, favorites`; valores de `tab` e `sort`) e docs/api-mock/cenarios.md ("Validação dos corpos... `422` com `fields`")
- `src/mocks/db/money.ts` (`ethToUnits`), `src/schemas/common.ts` (`networkSchema`, `ethAmountSchema`)

## Instruções
1. Exportar `CatalogQuery = { q: string | null; tab: 'all' | 'new' | 'trending'; collection: string | null; network: Network | null; minUnits: number | null; maxUnits: number | null; sort: 'recent' | 'price_asc' | 'price_desc' | 'top_rated' | 'most_favorited'; page: number; pageSize: number; favorites: boolean }`.
2. `parseCatalogQuery(params: URLSearchParams): { ok: true; query: CatalogQuery } | { ok: false; fields: Record<string, string> }`:
   - `q`: `trim`, até 100 caracteres (mais → erro), vazio → `null`;
   - `tab` (padrão `all`) e `sort` (padrão `recent`): só os valores do contrato; outro → erro;
   - `collection`: texto até 60 caracteres; `network`: `networkSchema`;
   - `minPrice`/`maxPrice`: string de ETH (`ethAmountSchema`) → `ethToUnits`; `minPrice > maxPrice` → erro em `maxPrice`;
   - `page`: inteiro ≥ 1 (padrão 1); `pageSize`: inteiro de 1 a **300** (padrão 9); `favorites`: só `1` (→ `true`); outro valor → erro; ausente → `false`.
   - Mensagens em PT-BR, uma por campo (ex.: `page`: "A página deve ser um número inteiro a partir de 1.", `maxPrice`: "O preço máximo deve ser maior ou igual ao mínimo.", `pageSize`: "O tamanho da página deve ficar entre 1 e 300.").
3. Sem `msw`: função pura. Fechamento: `npx prettier --write src/mocks/db/catalogParams.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/catalogParams.ts` e `git commit -m "06-010: parâmetros do catálogo no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem parâmetros → `{ tab: 'all', sort: 'recent', page: 1, pageSize: 9, … }`.
- [ ] `page=0`, `tab=x`, `sort=y`, `pageSize=301`, `favorites=2`, `minPrice=2&maxPrice=1` → `ok: false` com o campo certo.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-019.
