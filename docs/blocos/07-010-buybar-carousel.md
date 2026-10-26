# 07-010 — `BuyBar` (mobile) e `NftCarousel`

**Status:** concluído
**Fluxo / subitem:** Detalhes › 6, 8 (barra de compra, "Mais desta coleção")
**Depende de:** 07-007

## Objetivo
Barra fixa de compra do mobile e carrossel de cards relacionados (desktop).

## Arquivos
- criar: `src/components/shared/BuyBar.tsx`
- criar: `src/components/shared/NftCarousel.tsx`

## Referências
- docs/design/componentes.md (`BuyBar`, `NftCarousel`); tela mobile (barra) e desktop (carrossel) de detalhes
- `QuantityStepper` (07-007), `PriceTag`, `PriceChangedNotice`, `NftCard`, `NftCardSkeleton`, `ErrorState`, `src/components/ui/carousel.tsx`, `CatalogSection.tsx` (padrão do título de seção)

## Instruções
1. `BuyBar({ price, stepper, onBuy, onAddToCart, canAdd, soldOut, pending, added, updated, className })`: `fixed inset-x-0 bottom-0 lg:hidden`, `padding-bottom` com `env(safe-area-inset-bottom)`. Linha 1: "Qtd." + `QuantityStepper size="sm"` (`stepper` = props dele, inclusive `hint`) + `PriceTag` à direita (+ `PriceChangedNotice kind="updated"` se `updated`). Linha 2: botão "Comprar NFT" (largo) e botão redondo só com ícone de carrinho, `aria-label` "Adicionar ao carrinho" (com `added`: ícone de check e `aria-label` "Adicionado ao carrinho"). `soldOut`: "Esgotado" desabilitado no lugar de "Comprar NFT" e carrinho desabilitado. Com `pending`, `aria-busy` e clique ignorado. Exportar `BUY_BAR_SPACE_CLASS` (padding inferior que a página usa para o conteúdo não ficar atrás da barra).
2. `NftCarousel({ title, items, isLoading, isError, onRetry, onAddToCart, onToggleFavorite, favoriteBusyIds, cartBusyIds, className })`: `section` com `aria-labelledby`, título `h2` no estilo de seção do Figma ("Mais desta coleção", linha divisória), `Carousel` com 5 cards por vez no desktop (`NftCard` com as mesmas props da Início) e `CarouselDots`. `isLoading`: 5 `NftCardSkeleton`. `isError`: `ErrorState` compacto (`as="h3"`) com "Tentar novamente" **dentro da seção** (não derruba a página). `items` vazio e sem erro: não renderiza nada.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-010: barra de compra e carrossel`.

## Critérios de aceite
- [ ] Sem `any`; `BuyBar` oculta no desktop; sem cor hexadecimal fora dos tokens.
- [ ] Acessibilidade: botões com nome, alvo ≥ 44 px, sem overflow horizontal em 320 px; carrossel navegável por teclado.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 07-016.
