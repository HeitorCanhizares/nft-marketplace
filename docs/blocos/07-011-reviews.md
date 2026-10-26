# 07-011 — Avaliações: hook, painel e `Sheet`

**Status:** pendente
**Fluxo / subitem:** Detalhes › 7 (avaliações só leitura, "Carregar mais", drawer no mobile)
**Depende de:** 07-004, 07-007

## Objetivo
Carregar as avaliações por páginas e exibi-las num painel (aba do desktop) e num `Sheet` (mobile).

## Arquivos
- criar: `src/hooks/useReviews.ts`
- criar: `src/components/shared/ReviewsPanel.tsx`
- criar: `src/components/shared/ReviewsSheet.tsx`

## Referências
- docs/fluxos/detalhes-nft.md (subitem 7); docs/arquitetura/estado.md (chave `nfts.reviews(id, page)`)
- `src/components/ui/sheet.tsx`, `LoadMoreButton`, `RatingStars`, `EmptyState`, `ErrorState`, `Skeleton`, `src/contexts/liveAnnouncer.ts`

## Instruções
1. `useReviews(nftId, enabled)`: estado `pages` (começa em 1); `useQueries` para as páginas `1..pages` com `nfts.reviews(nftId, p)` e `getReviews` (só com `enabled`). Devolve `{ items, total, hasMore, isLoading, isError, isLoadingMore, loadMore, retry }`; `total` e `hasMore` vêm da primeira página e da última carregada. `loadMore` ignora clique enquanto carrega.
2. `ReviewsPanel({ reviews, className })` (`reviews` = retorno do hook): lista `ul` de `li`/`article`: `RatingStars` (só as estrelas), autor, data (`<time dateTime>` formatada com `Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })`) e texto; abaixo `LoadMoreButton` "Carregar mais" quando `hasMore`. Após carregar mais: anunciar "Mostrando X de Y avaliações" (`polite`); se o botão sumir com o foco nele, mover o foco para a lista (`tabIndex={-1}`). Estados: carregando (skeletons), erro (`ErrorState as="h3"` com "Tentar novamente"), `total 0` ("Ainda não há avaliações", `EmptyState`).
3. `ReviewsSheet({ open, onOpenChange, count, reviews })`: `Sheet` `side="bottom"`, título "Avaliações de colecionadores (N)", `SheetDescription` `sr-only`, corpo rolável com `ReviewsPanel`. Altura máxima ~85dvh.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-011: avaliações`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect` que só copia state; páginas acumuladas na ordem.
- [ ] Acessibilidade: Esc fecha o sheet e devolve o foco ao gatilho; "Carregar mais" por teclado; sem escrita nem botões de resposta.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Fluxo no 07-016.
