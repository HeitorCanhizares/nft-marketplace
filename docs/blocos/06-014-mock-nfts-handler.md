# 06-014 — Mock: handler `GET /nfts`

**Status:** concluído
**Fluxo / subitem:** Início › 3 a 7, 9, 12 (catálogo, filtros, ordenação, favoritos, vazio)
**Depende de:** 06-009, 06-010, 06-011, 06-012, 06-013, 05-006, 02-008
**Depende de decisão:** perguntas 3 e 4 do relatório da fase 06

## Objetivo
Registrar `GET /nfts` no mock: parâmetros, filtros, ordenação, paginação, `facets`, `isFavorite` e os cenários `empty-catalog`, `session-expired` (só com `favorites=1`) e os de erro.

## Arquivos
- criar: `src/mocks/handlers/nfts.ts`
- alterar: `src/mocks/handlers/sessionGuard.ts`
- alterar: `src/mocks/browser.ts`

## Referências
- docs/api-mock/contratos.md (`GET /nfts`; "`favorites=1` exige token. Busca sem resultado devolve `200` com `items: []`") e docs/api-mock/cenarios.md (`empty-catalog`, `server-error:GET /nfts`, `offline`, `session-expired`)
- `src/mocks/handlers/auth.ts` (padrão de handler com `withMock`, `apiPath`, `apiError`, `validationError`), `src/mocks/handlers/sessionGuard.ts` (`authenticate`)

## Instruções
1. `sessionGuard.ts`: acrescentar `tryAuthenticate(request: Request): Promise<AuthenticatedRequest | null>` — igual a `authenticate`, mas **nunca devolve `Response`**: sem token, token desconhecido, usuário inexistente ou sessão vencida → `null` (rotas públicas tratam como visitante).
2. `handlers/nfts.ts`: `nftsHandlers = [http.get(apiPath('/nfts'), withMock('GET /nfts', resolver))]`. O resolver, em ordem:
   1. `parseCatalogQuery(new URL(request.url).searchParams)`; erro → `validationError`-equivalente: `apiError('VALIDATION_ERROR', { fields })`;
   2. `favorites=true`: se `hasScenario('session-expired')` → `apiError('SESSION_EXPIRED')`; senão `authenticate(request)` (Response → devolve). Sem `favorites`: `tryAuthenticate`;
   3. `favoriteIds` = `Set` dos ids de `favoritesStore.listByUserId(user.id)` quando há usuário; senão `null`;
   4. `all` = `[]` se `hasScenario('empty-catalog')`, senão `nftsStore.getAll()`;
   5. `context = buildCatalogContext(all, favoriteIds)`; `filtered = applyFilters(all, query, context)`; `favoriteCounts` = mapa `id → stats.favoritesTotal + (favoritos reais de todos os usuários)` (`usersStore.getAll()` + `favoritesStore.listByUserId`); `sorted = sortNfts(...)`;
   6. paginar: `total = sorted.length`, `totalPages = ceil(total / pageSize)` (0 se vazio), `items` = fatia de `(page−1)×pageSize` (página além do fim → `items: []`, `page` devolve o pedido);
   7. resposta `200`: `{ items: items.map((r) => toNftSummary(r, favoriteIds ?? undefined)), page, pageSize, total, totalPages, facets: buildFacets(all, query, context) }`.
3. `browser.ts`: importar e acrescentar `...nftsHandlers` a `resourceHandlers`.
4. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/nfts.ts src/mocks/handlers/sessionGuard.ts src/mocks/browser.ts` e `git commit -m "06-014: handler GET /nfts"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; resposta valida em `catalogResponseSchema`.
- [ ] `GET /api/nfts` → 9 itens, `total` 283, `totalPages` 32; `?favorites=1` sem token → `401 UNAUTHORIZED`; com `empty-catalog` → `items: []`, `total` 0, facets com contagens 0.
- [ ] `isFavorite` aparece só com token válido; token vencido em rota pública → trata como visitante (200).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- auth-mock` continua verde.
- Coberto no 06-019.
