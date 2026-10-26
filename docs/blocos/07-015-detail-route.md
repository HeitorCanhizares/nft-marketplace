# 07-015 — Página, rota com `loader`, 404 e título

**Status:** concluído
**Fluxo / subitem:** Detalhes › 5, 6, 10, 11, 12 (acesso direto, 404, ligação de tudo)
**Depende de:** 07-013, 07-014
**Depende de decisão:** perguntas 2 e 3 do relatório da fase 07

## Objetivo
Trocar a rota provisória por `NftDetails`: carregar pelo `loader`, tratar 404, ligar hooks aos layouts e definir o título do documento.

## Arquivos
- criar: `src/pages/NftDetails/NftDetails.tsx`
- alterar: `src/routes/nft.$nftId.tsx`
- alterar: `src/hooks/useRouteChrome.ts`

## Referências
- docs/fluxos/detalhes-nft.md (subitens 6 e 12); `src/components/layout/RouteFallbacks.tsx` (`RouteError`, estilo do 404), `EmptyState`, `src/app/queryClient.ts` (singleton `queryClient`), `src/hooks/useRouteFocus.ts`
- Hooks: `useNftDetail`, `nftDetailOptions`, `useNftPurchase`, `useAddEditionToCart`, `useNftDetailLive`, `useToggleFavorite`

## Instruções
1. Rota: `loader` faz `queryClient.ensureQueryData(nftDetailOptions(params.nftId))` e devolve `{ notFound: false, documentTitle: nft.name }`; se der `ApiError` com `status === 404`, devolve `{ notFound: true, documentTitle: 'NFT não encontrado' }`; outros erros propagam (o `RouteError` padrão mostra o `ErrorState` com "Tentar novamente"). `pendingComponent: NftDetailSkeleton`, `pendingMs: 200`. Sem `mobileTabBar`. `component` renderiza `NftDetails` com `nftId`.
2. `useRouteChrome`: o título passa a ser `loaderData.documentTitle` da rota mais profunda quando existir (com guarda de tipo, sem `any`), senão o `staticData.title` de antes. O documento fica "<nome> | Kurio" e "NFT não encontrado | Kurio".
3. `NftDetails({ nftId })`: `useNftDetail(nftId)`; sem dados e `loaderData.notFound` → `EmptyState as="h1"` "NFT não encontrado" com botão-link "Ver o catálogo" (`/`, `hash: 'catalogo'`); sem dados por outro motivo → `NftDetailSkeleton`. Com dados, componente interno que chama `useNftDetailLive`, `useNftPurchase`, `useAddEditionToCart`, `useToggleFavorite` e monta `NftDetailViewProps` para `NftDetailDesktop` ou `NftDetailMobile` (`useIsDesktop()`).
4. `onBuy`: com `purchase.canAdd` → `add({ editionId, quantity, mode: 'buy' })` (vai a `/carrinho` no sucesso); sem `canAdd` mas com `purchase.inCart > 0` → só `navigate({ to: '/carrinho' })` (sem adicionar); esgotado → nada. `onAddToCart` (mobile) → `add({ …, mode: 'cart' })`, só com `canAdd`. `favorite.onToggle` → `toggle(nft)`; `favorite.busy` → `pendingIds.has(nft.id)`.
5. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-015: página de detalhes e rota`.

## Critérios de aceite
- [ ] Sem `any`; refresh e link direto abrem igual à navegação interna; id inexistente mostra a página de 404 com título correspondente.
- [ ] O foco vai para o `h1` ao navegar; nenhum hook chamado condicionalmente.
- [ ] Páginas `/`, `/carrinho` e as demais mantêm seus títulos.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; abrir `/nft/emerald-ape-042` e `/nft/nao-existe` no navegador; `npm run test:e2e -- layout` verde.
