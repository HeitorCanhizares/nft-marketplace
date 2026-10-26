# 07-013 — Detalhe: layout desktop

**Status:** pendente
**Fluxo / subitem:** Detalhes › 1–10 (tela desktop completa)
**Depende de:** 07-005, 07-006, 07-007, 07-008, 07-009, 07-010, 07-011, 07-012

## Objetivo
Montar a tela desktop: breadcrumb, galeria, painel de compra, abas e "Mais desta coleção".

## Arquivos
- criar: `src/pages/NftDetails/viewProps.ts`
- criar: `src/pages/NftDetails/NftDetailDesktop.tsx`
- criar: `src/pages/NftDetails/NftDetailTabs.tsx`

## Referências
- Tela: docs/design/telas/desktop-detalhes.png (1:1); docs/fluxos/detalhes-nft.md
- Componentes: `Breadcrumb`, `NftGallery`, `PriceTag`, `PriceChangedNotice`, `RatingStars`, `EditionSelector`, `QuantityStepper`, `FavoriteButton variant="text"`, `NftMeta`, `ShareLinks`, `NftCarousel`, `ReviewsPanel`, `ui/tabs`, `ui/button`
- Hooks já feitos: `useReviews`, `useRelatedNfts`, `useToggleFavorite`, `useAddToCart` (cards do carrossel)

## Instruções
1. `viewProps.ts`: `NftDetailViewProps = { nft: NftDetail; purchase: ReturnType<typeof useNftPurchase>; updatedEditionId: string | null; cart: { onBuy: () => void; onAddToCart: () => void; pending: boolean; added: boolean; error: { editionId: string; message: string } | null }; favorite: { onToggle: () => void; busy: boolean } }`.
2. `NftDetailDesktop(props)`: `container-page`; `Breadcrumb` com "Início" (`/`), "Mercado" (`/`, `hash: 'catalogo'`) e o **nome do NFT** como último item (`aria-current="page"`). Duas colunas: `NftGallery` | painel: `h1` com o nome; linha com `PriceTag` da **edição escolhida** (`previousPrice` só se for a edição `nft.defaultEditionId`), `PriceChangedNotice kind="updated"` quando `updatedEditionId` é a escolhida, e `RatingStars` à direita; divisor; `h2` "Sobre este NFT:" + descrição; "Edição:" + `EditionSelector`; linha com `QuantityStepper` (`max`, `hint`; mais `inCartText` em texto pequeno), botão "COMPRAR" e `FavoriteButton variant="text"`; `NftMeta`; `ShareLinks` (`url` = `window.location.origin` + `/nft/<id>`).
3. Estados do painel: todas as edições esgotadas → "COMPRAR" desabilitado com o texto "Esgotado" e stepper desabilitado; `cart.error` da edição escolhida e `purchase.notice` aparecem como texto junto ao stepper (`role="status"`); `COMPRAR` com `cart.pending` fica `aria-busy` e ignora clique.
4. `NftDetailTabs({ nft, value, onValueChange, reviewsTriggerRef })`: `Tabs` controlada com "Detalhes do NFT" (corpo `details.body` e os blocos "Rede:", "Contrato:", "Direitos autorais:" = `details.network`, `details.contract`, `details.royalties`) e "Avaliações de colecionadores (N)" (`rating.count`); o conteúdo de avaliações usa `useReviews(nft.id, value === 'reviews')` + `ReviewsPanel`.
5. Na `NftDetailDesktop`: estado da aba (`'details'` inicial) e a nota: o clique em `RatingStars` faz `setTab('reviews')`, `scrollIntoView` da seção de abas (`behavior: 'auto'` se `prefers-reduced-motion`, senão `'smooth'`) e, no frame seguinte, foco no gatilho da aba de avaliações (`reviewsTriggerRef`). Abaixo: `NftCarousel` "Mais desta coleção" com `useRelatedNfts`, `useToggleFavorite` e `useAddToCart` (como na Início), `onRetry` = `refetch`.
6. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-013: detalhe desktop`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect` que copia state; sem valores monetários calculados.
- [ ] Um só `h1`; aba de avaliações só busca ao ser aberta; erro de relacionados ou avaliações não derruba o resto.
- [ ] Acessibilidade: ordem de foco segue a ordem visual; abas por teclado; sem overflow horizontal em 1024 px.
- [ ] Sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Visual no 07-016 (renderizada pelo 07-015).
