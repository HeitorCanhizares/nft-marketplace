# 08-011 — Telas do carrinho: `CartDesktop`, `CartMobile` e props

**Status:** concluído
**Fluxo / subitem:** Carrinho › 1, 10 (recomendações), layout das duas telas
**Depende de:** 08-009, 08-010, 08-004

## Objetivo
As duas telas de apresentação do carrinho, recebendo tudo pronto por props (a ligação com os dados é do 08-012).

## Arquivos
- criar: `src/pages/Cart/viewProps.ts`
- criar: `src/pages/Cart/CartDesktop.tsx`
- criar: `src/pages/Cart/CartMobile.tsx`

## Referências
- Telas: `desktop-carrinho.png` e `mobile-carrinho.png` (1:1)
- `src/pages/NftDetails/viewProps.ts`, `NftDetailDesktop.tsx` e `NftDetailMobile.tsx` (mesmo padrão: props prontas, `useAddToCart`, `useToggleFavorite`, `NftCarousel`), `src/components/layout/Breadcrumb.tsx`, `src/components/layout/MobileTopBar.tsx`, `src/hooks/useRecommendedNfts.ts` (08-005)
- docs/design/componentes.md (`NftCarousel` "Colecionadores também viram")

## Instruções
1. `viewProps.ts`: `CartViewProps = { items: CartItem[]; priceChanges: ReadonlyMap<string, { from: string; to: string }>; busyIds: ReadonlySet<string>; actions: { onQuantityChange; onRemove; onAdjust }; summary: Omit<props do CartSummaryPanel, 'variant'> }` (reaproveitar os tipos exportados pelos componentes; **não** repetir campos).
2. `CartDesktop` (`container-page`): `Breadcrumb` (Início → `/`, Mercado → `/` com `hash="catalogo"`, **Carrinho** como página atual), `h1` **"Carrinho de NFTs"** só para leitor de tela (`sr-only max-lg:hidden`; no mobile o `h1` é o da `MobileTopBar`); grade de duas colunas (`lg:grid-cols-[1fr_…]`, larguras do Figma): `LineItemList variant="cart-row"` à esquerda e `CartSummaryPanel variant="desktop"` à direita (com `lg:sticky` se couber sem sobrepor o rodapé). Abaixo, `NftCarousel title="Colecionadores também viram"` alimentado por `useRecommendedNfts(ids dos NFTs do carrinho)`, `useToggleFavorite` e `useAddToCart` (como no `NftDetailDesktop`). Erro nas recomendações fica **dentro da seção** e não afeta o carrinho.
3. `CartMobile`: `MobileTopBar title="Carrinho de NFTs"` (voltar padrão), `LineItemList variant="cart-card"` e `CartSummaryPanel variant="mobile"` no fim. **Sem** carrossel de recomendações. Conteúdo com espaço para o painel não cobrir o último card.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-011: telas do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; **nenhum componente visual novo** dentro de `pages/` (só composição); sem cor hexadecimal fora dos tokens.
- [ ] Desktop: um só `h1` visível para leitor de tela; mobile: um só `h1` (o do topo).
- [ ] Acessibilidade: ordem de foco lista → resumo; sem overflow horizontal em 320 px e com o painel mobile aberto.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 08-013.
