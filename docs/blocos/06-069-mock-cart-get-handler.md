# 06-069 — Mock: handler `GET /cart`

**Status:** pendente
**Ordem de execução:** logo **depois do 06-027** (e antes do 06-028). Os blocos 06-069, 06-070 e 06-071 formam uma sequência; só então segue o 06-028.
**Fluxo / subitem:** Início › 8 (o contador do cabeçalho reflete o que o card adicionou)
**Depende de:** 06-018, 06-009, 05-006, 02-008

## Objetivo
Registrar `GET /cart`: devolve o carrinho do usuário (pela sessão) ou do visitante (pelo `X-Cart-Id`), seguindo a convenção de ids da fase 05.

## Arquivos
- alterar: `src/mocks/handlers/cart.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: "com sessão, o carrinho do usuário; sem sessão, cabeçalho `X-Cart-Id`"; `GET /cart` → `Cart`; `itemCount` = total de **unidades**) e docs/api-mock/persistencia.md ("`cart-<userId>`; o do visitante tem `id = ownerId = X-Cart-Id`") e cenarios.md (`empty-cart`)
- `src/mocks/handlers/cart.ts` (o `POST /cart/items` do 06-018: **mesma identificação do dono**; extrair a função local `resolveOwner` se ainda não existir), `src/mocks/db/cartMerge.ts` (`userCartId`), `src/mocks/db/stores.ts` (`cartsStore`, `nftsStore`)

## Instruções
1. Acrescentar a `cartHandlers` a rota `http.get(apiPath('/cart'), withMock('GET /cart', resolver))` (sem `protected`).
2. Dono: com cabeçalho `Authorization`, `authenticate(request)` (falha → devolve a `Response`) e `cartId = userCartId(user.id)`; sem ele, `readCartId(request)`. **Sem sessão e sem `X-Cart-Id`** → `200` com carrinho vazio **não gravado**: `{ id: 'guest-empty', items: [], itemCount: 0, version: 0 }`.
3. Cenário `empty-cart` → o mesmo carrinho vazio (sem apagar nada do banco). Carrinho inexistente no banco → vazio com o `id` do dono.
4. Carrinho existente: reler o estoque atual de cada linha (`nftsStore.get`) e devolver cada item com `available` e `availability` **recalculados** (`sold_out` com 0, `insufficient` com `available < quantity`, `low_stock` com `available <= 3`, senão `available`); `quantity`, `unitPrice` e `lineTotal` ficam como gravados (preço e cotação são da fase 08). Linha cujo NFT não existe mais é omitida. `itemCount` = soma das `quantity`. Resposta **sem** `ownerId`, validando em `cartSchema`. **Não** grava nada.
5. Fechamento: `npx prettier --write src/mocks/handlers/cart.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/cart.ts` e `git commit -m "06-069: handler GET /cart"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `GET /cart` com `X-Cart-Id` devolve o que o `POST /cart/items` gravou (`itemCount` = soma das quantidades).
- [ ] Logado, devolve `cart-user-teste`; token vencido → `401 SESSION_EXPIRED`; sem nada → vazio `guest-empty`; `empty-cart` → vazio; `server-error:GET /cart` → `500`.
- [ ] Depois de zerar o estoque de uma edição no banco, a linha vem `sold_out`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- auth-mock` verde. Coberto no 06-063 (item 14).
