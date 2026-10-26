# 06-056 — `HomeMobile` (composição da Início no mobile)

**Status:** concluído
**Fluxo / subitem:** Início › 1, 3 a 9, 11, 12 (mobile)
**Depende de:** 06-054, 06-023, 06-044, 06-045, 06-046, 06-052
**Depende de decisão:** perguntas 7 e 10 do relatório da fase 06

## Objetivo
Montar a Início do mobile como no Figma: busca com botão de filtros, hero em card e catálogo com "Carregar mais" (sem promos, blog nem rodapé).

## Arquivos
- criar: `src/pages/Home/HomeMobile.tsx`

## Referências
- Captura 1:1 `mobile-inicio.png`; docs/fluxos/inicio.md (subitens 3 a 7)
- Medidas (414 px): margem lateral **24 px**; barra de busca y 40–84 (45 px) com o botão de filtros ao lado (45×45, 9 px de distância); **17 px** até o hero (y 101–290, 365×190); **19 px** até as abas (y 309–326); **17 px** até o primeiro card (y 343); a barra inferior (96 px) já é reservada pelo `AppShell`
- `src/hooks/useHome.ts`, `src/hooks/useCatalogPage.ts`, `src/components/layout/AppShell.tsx` (padding inferior)

## Instruções
1. `HomeMobile({ search }: { search: HomeSearch })`: `home = useHome()`, `page = useCatalogPage(search)`.
2. `<div className="flex flex-col gap-4 px-6 pt-[calc(2.5rem+env(safe-area-inset-top))]">`:
   1. linha `flex items-center gap-2.25`: `SearchInput variant="bar"` (`initialQuery={search.q}`, `onSearch={page.onSearch}`) e `FilterSheet` (`facets`, `collection`, `network`, `priceMin`, `priceMax`, handlers, `sort={page.sort}`, `onSortChange={page.onSortChange}`, `total={page.total}`, `activeCount={page.activeCount}`, `hasActiveFilters`, `onClear={page.onClearFilters}`);
   2. **Hero:** `HeroBanner` (`slides`, `variant="mobile"`, `onExplore={page.onExplore}`); carregando → `HeroBannerSkeleton variant="mobile"`; **erro de `/home`** → um `ErrorState` compacto ("Não foi possível carregar os destaques", "Tentar novamente") no lugar do hero; o catálogo continua;
   3. `CatalogSection` (props de `page`, `isDesktop={false}`, `loadMore={{ onLoadMore: page.onLoadMore, loading: page.loadingMore, hasMore: page.hasMore }}`, **sem** `pagination`). O espaço de 19 px entre hero e abas vem de `pt-1` no `CatalogSection` ou de um `mt-1` aqui.
3. Sem promos, blog, destaque nem filtros laterais (como no Figma). Sem cor hexadecimal. Export nomeado.
4. Fechamento: `npx prettier --write src/pages/Home/HomeMobile.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/pages/Home/HomeMobile.tsx` e `git commit -m "06-056: HomeMobile"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Posições conferidas com a captura (tolerância de 4 px): barra, botão, hero, abas, primeiro card.
- [ ] Em 320 px: sem rolagem horizontal; o conteúdo não fica atrás da barra inferior (último card e "Carregar mais" visíveis).
- [ ] Digitar na busca atualiza `?q=` (com `replace`) depois de 300 ms e volta a página 1.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** em 414×896 e 320×700.
