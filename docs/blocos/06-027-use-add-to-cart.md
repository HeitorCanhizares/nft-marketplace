# 06-027 — Hook `useAddToCart` (adicionar pelo card)

**Status:** pendente
**Fluxo / subitem:** Início › 8 (adiciona 1 unidade da edição do preço exibido; anuncia; erro desfaz e avisa)
**Depende de:** 06-007, 06-024
**Depende de decisão:** pergunta 5 do relatório da fase 06 (o contador do cabeçalho vem nos blocos 06-069 a 06-071, executados logo depois deste)

## Objetivo
Adicionar 1 unidade da edição de menor preço disponível ao carrinho a partir do card, funcionando para visitante e logado.

## Arquivos
- criar: `src/hooks/useAddToCart.ts`

## Referências
- docs/fluxos/inicio.md (subitem 8 e 12) e docs/api-mock/contratos.md (`POST /cart/items`; carrinho do visitante por `X-Cart-Id`, decisão A1)
- `src/lib/session.ts` (`readSession`, `ensureGuestCartId`), `src/services/api/cart.ts`, `src/hooks/queryKeys.ts` (`cart`, `nfts.lists`), `src/services/http/ApiError.ts` (`isApiError`), `sonner`

## Instruções
1. `useAddToCart()` devolve `{ add(nft: NftSummary): void; pendingIds: ReadonlySet<string> }`.
2. `add`: sem `nft.defaultEditionId` ou com `nft.soldOut` → não faz nada. Se **não há sessão salva** (`readSession() === null`), chamar `ensureGuestCartId()` antes (cria o `X-Cart-Id`). Chamada repetida para o mesmo NFT enquanto pendente é ignorada.
3. `useMutation`: `mutationFn: addCartItem({ nftId: nft.id, editionId: nft.defaultEditionId, quantity: 1 })`;
   - `onSuccess(cart)`: `queryClient.setQueryData(queryKeys.cart, resposta)` (a chave `cart` de `hooks/queryKeys.ts`) e `toast.success(nft.name + ' adicionado ao carrinho')` (o toast é anunciado: **sem** `announce`);
   - `onError`: por `ApiError.code`: `SOLD_OUT` → `toast.error(nft.name + ' esgotou.')` + `invalidateQueries({ queryKey: nfts.lists })`; `QUANTITY_EXCEEDS_STOCK` → `toast.error('Você já tem o máximo disponível de ' + nft.name + ' no carrinho.')`; qualquer outro → `toast.error('Não foi possível adicionar ' + nft.name + ' ao carrinho. Tente de novo.')`;
   - `onSettled`: tirar o id de `pendingIds`.
4. Fechamento: `npx prettier --write src/hooks/useAddToCart.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useAddToCart.ts` e `git commit -m "06-027: hook useAddToCart"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; visitante: a requisição leva `X-Cart-Id` e o corpo é `{ nftId, editionId, quantity: 1 }` com a edição do `defaultEditionId`.
- [ ] Logado: a requisição leva `Authorization` e **não** `X-Cart-Id`.
- [ ] Esgotado: nenhuma requisição.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-063.
