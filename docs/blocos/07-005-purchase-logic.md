# 07-005 — Seleção de edição, quantidade e adicionar ao carrinho

**Status:** concluído
**Fluxo / subitem:** Detalhes › 3, 4, 6 (edição, quantidade, comprar e carrinho)
**Depende de:** 07-004

## Objetivo
Lógica pura do limite de quantidade, hook de estado da compra e hook de adicionar edição ao carrinho.

## Arquivos
- criar: `src/lib/maxQuantity.ts`
- criar: `src/hooks/useNftPurchase.ts`
- criar: `src/hooks/useAddEditionToCart.ts`

## Referências
- docs/fluxos/detalhes-nft.md (subitens 3, 4, 6)
- `src/hooks/useAddToCart.ts` (trava síncrona por `queryClient.isMutating`, `ensureGuestCartId`, `setQueryData(cart)`), `src/hooks/useCart.ts`, `src/hooks/useLiveChanges.ts` (padrão: ajustar state no render, anunciar em efeito), `src/contexts/liveAnnouncer.ts`

## Instruções
1. `maxQuantity.ts`: `MAX_PER_PURCHASE = 99`; `quantityLimit(edition, inCart)` → `{ max, kind }`. `available` numérico: `max = max(0, available - inCart)`, `kind 'stock'`; `null` (ABERTA): `max = max(0, 99 - inCart)`, `kind 'cap'`.
2. `useNftPurchase(nft)`: estado `selectedId` e `quantity`. Edição inicial = `nft.defaultEditionId` (senão a primeira). `selectEdition(id)` volta `quantity` para 1. Devolve `{ edition, editionId, selectEdition, quantity, increment, decrement, inCart, max, hint, canAdd, allSoldOut, notice }`. `inCart` = quantidade da edição escolhida em `useCart().data` (0 sem dados). `canAdd = !allSoldOut && edition.available !== 0 && max >= 1`. `hint` só existe quando `quantity >= max`: estoque → `Máximo disponível: N`; ABERTA → `Máximo por compra: N`; `max === 0` com `inCart > 0` → "Você já tem todas as unidades disponíveis no carrinho". Quando `inCart > 0`, também expor `inCartText` = "N já no seu carrinho".
3. Ajustes por tempo real **no render** (padrão do `useLiveChanges`): se a edição escolhida ficou com `available === 0`, trocar para `nft.defaultEditionId` e definir `notice` = "A edição X esgotou. Selecionamos a edição Y."; se `quantity > max` (com `max >= 1`), `quantity = max` e `notice` = "Quantidade ajustada para N: o estoque mudou." Um efeito anuncia `notice` (`polite`) uma vez. O front só compara inteiros.
4. `useAddEditionToCart(nft)`: `useMutation` com `mutationKey ['add-to-cart-detail']`; `add({ editionId, quantity, mode: 'buy' | 'cart' })` ignora o clique se `queryClient.isMutating({ mutationKey }) > 0`; visitante sem sessão: `ensureGuestCartId()`. Sucesso: `setQueryData(cart, data)`; `mode 'buy'` → `navigate({ to: '/carrinho' })`; `mode 'cart'` → `announce('Adicionado ao carrinho', 'polite')` e `added = true` por 2 s (timer limpo ao desmontar). **Sem toast.** Erro `SOLD_OUT` ou `QUANTITY_EXCEEDS_STOCK`: `error = { editionId, message }` ("Esta edição esgotou." / "Você já tem o máximo disponível desta edição no carrinho.") e invalidar `nfts.detail(nft.id)` e `cart`; outro erro: `toast.error('Não foi possível adicionar ao carrinho. Tente de novo.')`. Devolve `{ add, pending, added, error }`; `error` some na nova tentativa.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-005: lógica de compra do detalhe`.

## Critérios de aceite
- [ ] Sem `any`; sem `useEffect` que só copia state; sem ref lida no render.
- [ ] Estoque 3 e 2 no carrinho → `max` 1; ABERTA com 0 no carrinho → `max` 99; trocar a edição zera a quantidade para 1.
- [ ] Dois cliques seguidos em `add` disparam uma única requisição.

## Verificação (Sonnet)
- format:check, lint, typecheck, build.
