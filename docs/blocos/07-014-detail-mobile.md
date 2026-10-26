# 07-014 — Detalhe: layout mobile e skeleton

**Status:** pendente
**Fluxo / subitem:** Detalhes › 1–7, 12 (tela mobile completa e skeleton)
**Depende de:** 07-013

## Objetivo
Montar a tela mobile (imagem com voltar/favoritar, painel, `BuyBar`, avaliações em `Sheet`) e o skeleton da página.

## Arquivos
- criar: `src/pages/NftDetails/NftDetailMobile.tsx`
- criar: `src/pages/NftDetails/NftDetailSkeleton.tsx`

## Referências
- Tela: docs/design/telas/mobile-detalhes.png (1:1); docs/fluxos/detalhes-nft.md
- `viewProps.ts` (07-013), `NftGallery`, `FavoriteButton variant="circle"`, `RatingStars variant="pill"`, `EditionSelector`, `NftMeta`, `BuyBar` e `BUY_BAR_SPACE_CLASS`, `ReviewsSheet`, `useReviews`, `src/components/layout/MobileTopBar.tsx` (lógica de voltar), `src/components/ui/skeleton.tsx`

## Instruções
1. `NftDetailMobile(props: NftDetailViewProps)`: topo com `padding-top` de `safe-area-inset-top`; sobre a imagem, à esquerda o botão redondo "Voltar" (`router.history.canGoBack()` ? `back()` : `navigate({ to: '/' })`, como o `MobileTopBar`) e à direita `FavoriteButton variant="circle"`; `NftGallery` (swipe + zoom). Painel arredondado sobre a imagem: `h1` com o nome e `RatingStars variant="pill"` à direita (abre o `ReviewsSheet`; `useReviews(nft.id, open)`), descrição, "Edição:" + `EditionSelector`, textos de `purchase.notice`/`cart.error`/estoque (`role="status"`), `NftMeta`. Sem breadcrumb, carrossel nem compartilhar (só desktop). O painel usa `BUY_BAR_SPACE_CLASS` no fim.
2. `BuyBar`: `price` da edição escolhida, `stepper` ligado a `purchase`, `onBuy`/`onAddToCart`/`pending`/`added` de `cart`, `updated` quando `updatedEditionId` é a escolhida, `soldOut` = `purchase.allSoldOut`, `canAdd` = `purchase.canAdd`.
3. `NftDetailSkeleton`: `role="status"` `aria-busy` com texto `sr-only` "Carregando…"; variante desktop (breadcrumb, galeria, painel, abas) e mobile (imagem, painel, barra) conforme `useIsDesktop()`. Sem `h1` dentro dele.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-014: detalhe mobile e skeleton`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect` que copia state; um só `h1`.
- [ ] Acessibilidade: botões 44 px; `Sheet` fecha com Esc e devolve o foco à nota; sem overflow horizontal em 320 px; conteúdo não fica atrás da `BuyBar`.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 07-016 (renderizada pelo 07-015).
