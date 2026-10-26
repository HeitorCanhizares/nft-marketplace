# 06-052 — `CatalogSection` (título, abas, grade, paginação e estados)

**Status:** pendente
**Fluxo / subitem:** Início › 3, 4, 9, 12 (catálogo; "Seus favoritos"; vazio; erro só na área do catálogo)
**Depende de:** 06-038, 06-039, 06-040, 06-050, 06-051, 04-013, 04-014
**Depende de decisão:** perguntas 6 e 10 do relatório da fase 06 (títulos e textos dos estados)

## Objetivo
Montar a área do catálogo (título, abas com ordenação, grade, paginação ou "Carregar mais") e os estados de erro e vazio, só com dados recebidos por props.

## Arquivos
- criar: `src/components/shared/CatalogSection.tsx`

## Referências
- docs/fluxos/inicio.md (subitens 3, 9 e 12), docs/arquitetura/pastas.md (`components/shared` recebe dados por props e **não chama hooks de API**)
- `src/components/shared/EmptyState.tsx`, `ErrorState.tsx`, `CatalogTabs.tsx`, `NftGrid.tsx`, `SortSelect.tsx`, `CatalogPagination.tsx`, `LoadMoreButton.tsx`

## Instruções
1. Props:
   - `favoritesMode: boolean`; `isDesktop: boolean`; `tab: CatalogTab`, `onTabChange`; `sort: CatalogSort`, `onSortChange` (a ordenação só aparece aqui no desktop);
   - `status: 'loading' | 'error' | 'empty' | 'ready'`; `items?: NftSummary[]`; `busy?: boolean`; `updatedIds?`, `pendingFavoriteIds?`, `pendingCartIds?`; `onAddToCart`, `onToggleFavorite`;
   - `onRetry: () => void`, `retrying?: boolean`; `hasActiveFilters: boolean`, `onClearFilters: () => void`;
   - `pagination?: { page: number; totalPages: number; getHref: (page: number) => string; onPageChange: (page: number) => void }` (desktop); `loadMore?: { onLoadMore: () => void; loading: boolean; hasMore: boolean }` (mobile);
   - `titleRef?: Ref<HTMLHeadingElement>`, `gridRef?: Ref<HTMLUListElement>`, `className?`.
2. `<section id="catalogo" aria-labelledby={titleId} className="scroll-mt-8">`; o **título** é um `<h2 id tabIndex={-1} ref={titleRef} className="outline-none">`: texto "Seus favoritos" (visível, 24 px negrito, `mb-6`) em `favoritesMode`; senão "Catálogo de NFTs" com `sr-only`. O foco programático vai para ele.
3. Abaixo, `CatalogTabs` (`value={tab}`, `trailing={isDesktop ? <SortSelect value={sort} … /> : null}`) com o conteúdo conforme `status`:
   - `loading`: `NftGrid` sem `items` (`loadingCount` 9 no desktop, 6 no mobile);
   - `error`: `ErrorState` (`as="h3"`, título "Não foi possível carregar os NFTs", mensagem "Verifique sua conexão e tente novamente.", `onRetry`, `retrying`);
   - `empty`: `EmptyState` (`as="h3"`): em `favoritesMode` título "Você ainda não favoritou nenhum NFT", ação `Button asChild` `Link to="/"` "Explorar NFTs"; senão título "Nenhum NFT encontrado", descrição "Tente mudar os filtros ou a busca." e, com `hasActiveFilters`, ação `Button` "Limpar filtros" (`onClearFilters`);
   - `ready`: `NftGrid` (`items`, `busy`, `ref={gridRef}` e os demais props) e, **desktop** `pagination` → `CatalogPagination` com `mt-12`; **mobile** `loadMore?.hasMore` → `LoadMoreButton` com `mt-8`.
4. Sem hooks de API, sem `useNavigate`. Sem cor hexadecimal. Export nomeado.
5. Fechamento: `npx prettier --write src/components/shared/CatalogSection.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/CatalogSection.tsx` e `git commit -m "06-052: CatalogSection"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Há **um** `h2` (o título do catálogo) e o `id="catalogo"` está na seção; o erro e o vazio ficam **dentro** da área do catálogo, com as abas visíveis.
- [ ] "Seus favoritos" aparece só em `favoritesMode`; nos outros casos o título é só para leitor de tela.
- [ ] Desktop: ordenação à direita das abas e paginação abaixo; mobile: sem ordenação (vai no drawer) e com "Carregar mais".

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** nos 4 estados, nas duas larguras; comparado com as capturas; axe.
