# 08-005 — Serviços do carrinho, `useCartQuote` e `useRecommendedNfts`

**Status:** concluído
**Fluxo / subitem:** Carrinho › 5 (resumo pela cotação), 10 (recomendações)
**Depende de:** 08-003, 08-004

## Objetivo
Funções HTTP do carrinho e da cotação, e os dois hooks de leitura da página (cotação e recomendações).

## Arquivos
- alterar: `src/services/api/cart.ts`
- criar: `src/hooks/useCartQuote.ts`
- criar: `src/hooks/useRecommendedNfts.ts`

## Referências
- docs/arquitetura/estado.md (Padrões: `staleTime`, retry só em GET, `signal`, "o front **não faz contas** com valores", "cotação é a referência"), chaves `quote(input)` em `src/hooks/queryKeys.ts`
- `src/hooks/useCart.ts`, `src/hooks/useNftDetail.ts` (`useRelatedNfts`: padrão de reler ao entrar/sair da sessão, `ref` só dentro de efeito), `src/services/http/validate.ts` (`get`, `post`, `patch`, `del` — conferir os nomes exportados)

## Instruções
1. `services/api/cart.ts`, todas validando com o schema do recurso: `updateCartItem(itemId, quantity): Promise<Cart>` (`PATCH /cart/items/:itemId`), `removeCartItem(itemId): Promise<Cart>` (`DELETE`), `applyCartCoupon(code): Promise<Cart>` (`PUT /cart/coupon` `{ code }`), `removeCartCoupon(): Promise<Cart>` (`DELETE /cart/coupon`), `getQuote(signal?): Promise<Quote>` (`POST /quote` com corpo `{}`; `quoteSchema`).
2. `useCartQuote(cart: Cart | undefined)`: `useQuery` com `queryKey: quote({ cartVersion: cart?.version, coupon: cart?.coupon?.code ?? null })`, `queryFn: ({ signal }) => getQuote(signal)`, `enabled: cart !== undefined && cart.items.length > 0`, `placeholderData: keepPreviousData` (o valor antigo fica na tela enquanto recalcula). Devolve `{ quote: data, isUpdating: isFetching, isError, refetch }`. **Sem conta de valores.**
3. `useRecommendedNfts(excludeIds: readonly string[])`: `useQuery` com `nfts.recommendations` e `getRecommendedNfts`; mesma releitura ao mudar o status de autenticação do `useRelatedNfts` (não habilitar enquanto `status === 'loading'`). Devolve os que **não** estão em `excludeIds`, no máximo 10 (filtrar com `useMemo` pelo conteúdo ordenado dos ids, não pela referência). **Sem** `throwOnError`: erro aqui não derruba o carrinho.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-005: serviços e hooks de leitura do carrinho`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhuma soma, multiplicação ou comparação numérica de ETH.
- [ ] Mudar a quantidade (a `version` do carrinho muda) dispara nova cotação; durante ela o hook mantém a anterior e `isUpdating` é `true`.
- [ ] Carrinho vazio: nenhuma chamada a `/quote`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento coberto no spec do 08-013.
