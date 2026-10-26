# 06-055 — `HomeDesktop` (composição da Início no desktop)

**Status:** concluído
**Fluxo / subitem:** Início › 1 a 12 (desktop)
**Depende de:** 06-054, 06-023, 06-043, 06-046, 06-047, 06-048, 06-049, 06-052
**Depende de decisão:** perguntas 7 e 10 do relatório da fase 06 (erro de `GET /home`)

## Objetivo
Montar a Início do desktop como no Figma: hero, filtros com o destaque, catálogo, promos e blog.

## Arquivos
- criar: `src/pages/Home/HomeDesktop.tsx`

## Referências
- Captura 1:1 `desktop-inicio.png` e docs/design/componentes.md ("As páginas só montam componentes desta lista e ligam os dados")
- Medidas (coluna de 1200 px em `container-page`, x 120–1320): hero y 101–550; **96 px** entre as seções (hero→catálogo 97, paginação→promos 97, blog→rodapé 97); catálogo: filtros **310 px** + **48 px** + catálogo 842 px, a coluna dos filtros tem o `FilterPanel` e **24 px** abaixo o `FeaturedNftCard`; promos: 2 colunas com **28 px**; blog: título "Diário da Cunhagem" centralizado, **28 px** (`text-section`) negrito, subtítulo 14 px `muted-foreground` centralizado 8 px abaixo, **42 px** até os cards; 4 cards em grade de 4 colunas com **24 px** (no Figma os 4 cards deixam 56 px vazios à direita: aqui preenchem os 1200 px)
- `src/hooks/useHome.ts`, `src/hooks/useCatalogPage.ts`, `src/lib/catalogOptions.ts`

## Instruções
1. `HomeDesktop({ search }: { search: HomeSearch })`: `const home = useHome()`, `const page = useCatalogPage(search)`. Só monta componentes e liga props (nenhum componente visual novo; só classes de layout).
2. Estrutura: `<div className="container-page flex flex-col gap-24">`:
   1. **Hero:** `home.data` → `HeroBanner` (`slides={home.data.hero}`, `variant="desktop"`, `onExplore={page.onExplore}`); carregando → `HeroBannerSkeleton variant="desktop"`; **erro** (`home.isError`) → **um único** `ErrorState` (`as="h2"`, título "Não foi possível carregar os destaques", `onRetry={() => home.refetch()}`) no lugar do hero, do destaque, dos promos e do blog; o catálogo continua.
   2. **Catálogo:** `div` `grid grid-cols-[310px_1fr] items-start gap-12`: coluna esquerda `flex flex-col gap-6` com `FilterPanel` (`facets={page.facets}`, `collection={search.colecao}`, `network={search.rede}`, `priceMin={search.precoMin}`, `priceMax={search.precoMax}`, handlers, `hasActiveFilters`) e `FeaturedNftCard` (`home.data.featured`; skeleton enquanto carrega; some no erro); coluna direita `CatalogSection` (todas as props de `page`, `isDesktop`, `pagination={{ page: page.page, totalPages: page.totalPages ?? 0, getHref: page.getHref, onPageChange: page.onPageChange }}`).
   3. **Promos:** `div` `grid grid-cols-2 gap-7` com os 2 `PromoCard` (skeletons carregando).
   4. **Blog:** `<section aria-labelledby>`: `<h2 className="text-section font-bold text-center">Diário da Cunhagem</h2>`, `<p>` "Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.", e `ul` `grid grid-cols-4 gap-6` com os 4 `BlogCard` (skeletons carregando).
3. Sem cor hexadecimal, sem `fetch`/Axios direto. Export nomeado.
4. Fechamento: `npx prettier --write src/pages/Home/HomeDesktop.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/pages/Home/HomeDesktop.tsx` e `git commit -m "06-055: HomeDesktop"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] Posições conferidas com a captura (tolerância de 4 px): hero, filtros (x 120–429), catálogo (x 478–1319), promos, blog, 96 px entre seções.
- [ ] Erro em `GET /home` mantém o catálogo e os filtros; erro em `GET /nfts` mantém hero, promos e blog.
- [ ] Um `h2` por seção (hero, catálogo, blog); nenhum `h1` aqui (é da 06-057).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Ainda **sem** rota ligada (a 06-057 troca `Home`): verificar com um probe **não commitado** em 1440×900 e em 1024 px.
