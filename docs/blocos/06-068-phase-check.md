# 06-068 — Validação final e checkpoint da fase 06

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 06 › Checkpoint
**Depende de:** 06-001 a 06-071

## Objetivo
Validar a Início (hero, destaque, catálogo, busca, filtros, ordenação, favoritos, tempo real, estados) e os handlers do mock juntos, comparar com as capturas do Figma e entregar o resumo ao usuário.

## Arquivos
- nenhum arquivo commitado além dos dos blocos anteriores

## Referências
- docs/blocos/README.md (checkpoint e tag por fase), docs/design/telas/ (`desktop-inicio.png`, `mobile-inicio.png`), docs/qualidade/

## Instruções
1. Clone limpo: `npm ci`; `format:check`, `lint`, `typecheck`, `build`, `build:test`, `test:e2e` (desktop e mobile) e `lhci`.
2. Fluxo manual no navegador (`npm run dev` e `npm run preview`) com as credenciais do seed: hero (rotação, pausa), "EXPLORAR", todos os filtros e abas, as 5 ordenações, paginação (desktop) e "Carregar mais" (mobile), busca (cabeçalho e barra), card (hover, foco, carrinho, favoritar sem e com login, esgotado), `/?favoritos=1`, promos, blog, drawer de filtros, estados (`VITE_MOCK_SCENARIOS` temporário e **nunca commitado**: `slow`, `empty-catalog`, `offline`, `server-error:GET /nfts`, `jitter`), 414 e 320 px, zoom de 200 % e 400 %. **Em `npm run dev` (sem cenário forçado)** esperar 20–40 s com a Início aberta para ver o agendador do mock mudar um preço de verdade ("Atualizado" e o aviso).
3. Conferir:
   - nenhuma cor literal em `src/components/shared/{NftCard,NftCardActions,NftGrid,NftCardSkeleton,FavoriteButton,RarityBadge,PriceChangedNotice,PriceTag,HeroBanner,HeroBannerSkeleton,FeaturedNftCard,FeaturedNftCardSkeleton,PromoCard,PromoCardSkeleton,BlogCard,BlogCardSkeleton,CatalogTabs,SortSelect,FilterOptionList,PriceRangeFilter,FilterPanel,FilterSheet,CatalogPagination,LoadMoreButton,CatalogSection,SearchInput}.tsx` e em `src/pages/Home` (`grep` por `#`, `oklch(` e `rgb(`);
   - `grep -r __kurio dist/` vazio no build de produção;
   - camadas: `components/shared` e `components/layout` **não** importam `services/api` nem `hooks/use*` de API; só `main.tsx` importa de `mocks/`; `src/mocks/**` não importa nada do app além de `types`, `schemas` e `lib`; `routes/index.tsx` fino (só valida e monta);
   - a Início atrás do modal de `/entrar` e `/cadastro` continua sem filtros e sem quebrar (modal aberto, axe);
   - `git status` limpo e `src/routeTree.gen.ts` sem mudanças além das esperadas; o `SEED_VERSION` novo recria o banco sem perder o catálogo (283 NFTs);
   - LHCI (referência da fase 05: mobile performance 83, acessibilidade 100, LCP ≈ 3,36 s): **a Início agora carrega hero, 9 imagens e fontes**; registrar a mudança de performance/LCP e de CLS (deve ser 0) como pendência da fase 13, sem tentar corrigir aqui.
4. Entregar ao usuário: resumo, resultados, as imagens da baseline lado a lado com o Figma e como ver no navegador. Perguntar: (a) as medidas e as correções do Figma aceitas (lista do 06-067); (b) o drawer de filtros mobile (forma, textos, "Ver N resultados"); (c) os textos não desenhados (vazio, erro, favoritos vazio, "Esgotado", "Atualizado", avisos do tempo real); (d) o comportamento do tempo real (5 s, aviso agrupado); (e) os tokens novos (24, 20, 28, 22 px); (f) os NFTs do hero e do destaque; (g) a baseline visual.
5. **Só com o OK do usuário:** `git tag fase-06-inicio`. Sem push.

## Critérios de aceite
- [ ] Todos os comandos do item 1 com exit 0 no clone limpo.
- [ ] Capturas dentro da tolerância das tabelas de medidas dos blocos 06-037 a 06-056; contador do carrinho conferido (desktop com badge, mobile só no `aria-label`).
- [ ] Usuário aprovou a baseline e o checkpoint, e a tag foi criada.

## Verificação (Sonnet)
- É o próprio bloco de verificação; se algo falhar, o Sonnet devolve o bloco correspondente ao Haiku.
