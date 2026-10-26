# 06-054 — Hook `useCatalogPage` (liga o catálogo da Início)

**Status:** pendente
**Fluxo / subitem:** Início › 3 a 9, 11, 12 (a ligação entre URL, dados, ações, tempo real e foco)
**Depende de:** 06-022, 06-024, 06-025, 06-027, 06-028, 06-029, 06-030, 06-053, 06-003, 06-004
**Depende de decisão:** perguntas 4, 11 e 13 do relatório da fase 06

## Objetivo
Criar o hook que as páginas `HomeDesktop` e `HomeMobile` usam para o catálogo: consulta, estados, handlers de filtros/abas/ordem/busca/páginas, favoritos, carrinho, tempo real e foco, devolvendo tudo pronto para o `CatalogSection` e o `FilterPanel`/`FilterSheet`.

## Arquivos
- criar: `src/hooks/useCatalogPage.ts`

## Referências
- docs/fluxos/inicio.md (subitens 3 a 9, 11, 12) e docs/arquitetura/estado.md (URL é a fonte do estado de filtro)
- Os hooks citados em "Depende de" e `src/schemas/catalog.ts` (`hasActiveFilters`), `src/lib/catalogOptions.ts`

## Instruções
1. `useCatalogPage(search: HomeSearch)`; `isDesktop = useIsDesktop()`; `favoritesMode = search.favoritos === 1`; `tab = search.aba ?? 'todos'`; `sort = search.ordem ?? 'recentes'`; `page = search.pagina ?? 1`.
2. Consulta: `useCatalog(search, isDesktop)` → `status`: `'loading'` (sem dados e carregando), `'error'` (erro sem dados), `'empty'` (`items.length === 0`), `'ready'`; `busy = isPlaceholderData`; `retrying = isFetching && isError`; `facets = data?.facets`; `total`, `totalPages` de `data`.
3. Tempo real: `useNftSubscriptions(ids dos itens)`, `useNftLiveEvents()`, `{ updatedIds } = useLiveChanges(isPlaceholderData ? undefined : items, JSON.stringify(params))`. Ações: `useToggleFavorite()` e `useAddToCart()` (`pendingIds` de cada um). Foco: `useCatalogFocus({ ready: status === 'ready' && !isPlaceholderData, items, total, page, totalPages })`.
4. Handlers (todos via `useHomeNavigate(search)`; `setFilters` já volta à página 1):
   - `onTabChange(aba)` → `setFilters({ aba: aba === 'todos' ? undefined : aba })`; `onSortChange(ordem)` → `setFilters({ ordem: ordem === 'recentes' ? undefined : ordem })`;
   - `onCollectionChange(id)`, `onNetworkChange(id)` → `setFilters({ colecao })`/`({ rede })` (`push`); `onPriceApply({ min, max })` → `setFilters({ precoMin: min, precoMax: max })`;
   - `onSearch(q)` (mobile) → `setFilters({ q: q === '' ? undefined : q }, { replace: true })` (digitar não enche o histórico);
   - `onClearFilters` → `clearFilters()`; `hasActiveFilters = hasActiveFilters(search)` e `activeCount` (quantos de `q`, `colecao`, `rede`, faixa de preço estão ativos; a faixa conta 1);
   - `onPageChange(n)` (desktop) → `markPageChange()` e `setPage(n)` (`push`); `getHref(n)` → `router.buildLocation({ to: '/', search: { ...search, pagina: n <= 1 ? undefined : n } }).href`;
   - `onLoadMore()` (mobile) → `markLoadMore(items.length)` e `setPage(page + 1, { replace: true })`; `hasMore = items.length < total`; `loadingMore = isPlaceholderData`;
   - `onExplore()` → `explore()` e `focusCatalog()`;
   - `onRetry()` → `refetch()`; `onAddToCart(nft)` → `add(nft)` (o anúncio é do toast); `onToggleFavorite(nft)` → `toggle(nft)`.
5. **Página fora do intervalo (desktop):** quando há dados, `items.length === 0`, `totalPages > 0` e `page > totalPages`, `setPage(totalPages, { replace: true })` (um `useEffect`; sem laço).
6. Devolver um objeto único com `{ isDesktop, favoritesMode, tab, sort, page, status, items, busy, retrying, facets, total, totalPages, updatedIds, pendingFavoriteIds, pendingCartIds, titleRef, gridRef, hasActiveFilters, activeCount, hasMore, loadingMore, onTabChange, onSortChange, onCollectionChange, onNetworkChange, onPriceApply, onSearch, onClearFilters, onPageChange, getHref, onLoadMore, onExplore, onRetry, onAddToCart, onToggleFavorite }`.
7. Fechamento: `npx prettier --write src/hooks/useCatalogPage.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useCatalogPage.ts` e `git commit -m "06-054: hook useCatalogPage"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `useNavigate`/`useSearch` direto (tudo por `useHomeNavigate`).
- [ ] `?pagina=99` no desktop vira a última página (com `replace`); no mobile, `pagina` grande só devolve tudo.
- [ ] Trocar filtro, aba, ordem ou busca zera `pagina`; a página e o "Carregar mais" não.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061 a 06-065.
