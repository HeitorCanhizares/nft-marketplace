# 08-006 — `useCartItemActions`: quantidade, remover com "Desfazer" e ajustar

**Status:** concluído
**Fluxo / subitem:** Carrinho › 2 (quantidade), 3 (remover com Desfazer), 7 (Ajustar para N)
**Depende de:** 08-005

## Objetivo
Um hook com todas as ações sobre as linhas do carrinho, com atualização otimista, agrupamento de cliques e "Desfazer".

## Arquivos
- criar: `src/hooks/useCartItemActions.ts`

## Referências
- docs/fluxos/carrinho.md (subitens 2, 3 e 7); docs/arquitetura/estado.md ("Clique repetido em mutations: trava síncrona via `queryClient.isMutating({ mutationKey, predicate })`; **não usar state nem ref no render**; mutations do carrinho invalidam `cart` e `quote`")
- `src/hooks/useAddToCart.ts` (modelo de `mutationKey`, `isMutating`, toast), `src/hooks/useDebounce.ts`, `src/contexts/liveAnnouncer.ts`, `src/components/ui/sonner.tsx` (toast com `action`), `src/services/api/cart.ts`, `src/hooks/queryKeys.ts` (`cart`, `quote`)

## Instruções
1. `useCartItemActions()` devolve `{ setQuantity, remove, adjust, pendingIds }` (`pendingIds`: `ReadonlySet<string>` de linhas com requisição ativa, em state, **só para a UI**; a trava de clique repetido usa `queryClient.isMutating`).
2. **`setQuantity(item, quantity)`:** atualização otimista no cache `cart` (`setQueryData` trocando **só** `quantity` da linha e `itemCount`; **não calcula** `lineTotal`, o total da linha e o resumo ficam em estado de atualização até a resposta). Os cliques rápidos são **agrupados**: um único `PATCH` com o valor final, ~400 ms depois do último clique (temporizador em `useEffect`/callback, **nunca lido nem escrito durante o render**). Se já houver um `PATCH` da mesma linha em andamento (`isMutating` com predicado por `itemId`), o valor final espera e sai quando ele terminar. Sucesso: `setQueryData(cart, resposta)` e `invalidateQueries({ queryKey: quote })`. Erro: desfaz para o valor anterior ao primeiro clique do grupo, toast de erro e `invalidateQueries(cart)`; `QUANTITY_EXCEEDS_STOCK` → "Só há N unidades disponíveis" (usar `details.available`) e `SOLD_OUT` → "{nome} esgotou."; outros → "Não foi possível alterar a quantidade. Tente de novo.".
3. **`remove(item)`:** `DELETE` **na hora**, otimista (tira a linha do cache e ajusta `itemCount`). Sucesso: `toast('{nome} removido', { duration: 6000, action: { label: 'Desfazer', onClick } })` e `announce('{nome} removido do carrinho', 'polite')`. Erro: devolve a linha, toast de erro. Trava de clique repetido por linha (`mutationKey ['cart-remove']`).
4. **Desfazer:** `POST /cart/items` (`addCartItem`) com o mesmo `nftId`, `editionId` e `quantity`. Se vier `422 QUANTITY_EXCEEDS_STOCK`, repetir **uma vez** com `available − inCart` (de `details`) quando for ≥ 1 e avisar "Só havia N unidades disponíveis; adicionamos N."; se for 0, avisar "Não há mais estoque de {nome}.". Depois: `setQueryData(cart)` e invalidar `quote`. A linha volta **no fim da lista** (aceito).
5. **`adjust(item)`** ("Ajustar para N"): `setQuantity(item, item.available)` sem agrupar (envio imediato); anuncia "Quantidade de {nome} ajustada para N".
6. Foco após remover **não é deste hook** (é da página, 08-012).
7. Fechamento: `npx prettier --write src/hooks/useCartItemActions.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-006: ações dos itens do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `useRef` lido ou escrito no corpo do render; sem conta de ETH.
- [ ] Três cliques em "+" em menos de 400 ms geram **um** `PATCH` com o valor final.
- [ ] Remover chama `DELETE` imediatamente e o toast "Desfazer" dura ~6 s; desfazer recria a linha com a mesma edição e quantidade.
- [ ] Erro em qualquer ação desfaz o cache e avisa.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento coberto no spec do 08-013.
