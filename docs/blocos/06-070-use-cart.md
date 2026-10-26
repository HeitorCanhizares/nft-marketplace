# 06-070 — Serviço `getCart` e hook `useCart`

**Status:** pendente
**Ordem de execução:** logo **depois do 06-069** (que vem depois do 06-027 e antes do 06-028).
**Fluxo / subitem:** Início › 8 (contador do cabeçalho = total de unidades do carrinho)
**Depende de:** 06-007, 06-069, 03-009, 03-015

## Objetivo
Criar a leitura do carrinho (`GET /cart`) e o hook `useCart`, que mantém a query `cart` coerente com o login, o logout e as adições feitas pelo card.

## Arquivos
- alterar: `src/services/api/cart.ts`
- criar: `src/hooks/useCart.ts`

## Referências
- docs/arquitetura/estado.md ("O contador do carrinho no cabeçalho lê a query do carrinho"; chave `cart`; `clearPrivateSession` remove a chave no logout) e docs/api-mock/contratos.md (`Cart.itemCount`)
- `src/hooks/queryKeys.ts` (`cart`), `src/contexts/auth.ts` (`useAuth`), `src/hooks/useAddToCart.ts` (já faz `setQueryData` na chave `cart`)

## Instruções
1. `services/api/cart.ts`: acrescentar `getCart(signal?: AbortSignal): Promise<Cart>` → `get('/cart', cartSchema, { signal })`.
2. `useCart()`: `useQuery({ queryKey: cart, queryFn: ({ signal }) => getCart(signal), enabled: status !== 'loading' })` (`status` de `useAuth()`: espera a sessão ser recuperada, para a 1ª chamada já levar o `Authorization` certo). **Sem** `throwOnError`.
3. Um `useEffect` que, quando o `status` de autenticação **muda** depois da primeira renderização (entrar ou sair), faz `invalidateQueries({ queryKey: cart })` (o login mescla o carrinho do visitante no do usuário; o logout já remove a chave).
4. Devolve o resultado do `useQuery`. Falha ao ler o carrinho **não** pode quebrar o cabeçalho (quem usa trata `data` indefinido como 0).
5. Fechamento: `npx prettier --write src/services/api/cart.ts src/hooks/useCart.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/api/cart.ts src/hooks/useCart.ts` e `git commit -m "06-070: getCart e useCart"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a chave é `['cart']`.
- [ ] Visitante: a requisição leva `X-Cart-Id` quando existe; logado: `Authorization`.
- [ ] Entrar com um carrinho de visitante recarrega o carrinho (agora o do usuário, com a mescla).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-063 (item 14).
