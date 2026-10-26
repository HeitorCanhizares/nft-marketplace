# 06-018 — Mock: handler `POST /cart/items`

**Status:** concluído
**Fluxo / subitem:** Início › 8 (adicionar ao carrinho pelo card)
**Depende de:** 06-017, 05-006, 02-008
**Depende de decisão:** pergunta 5 do relatório da fase 06

## Objetivo
Registrar `POST /cart/items`: identifica o carrinho (usuário ou visitante), valida o corpo e chama `addToCart`.

## Arquivos
- criar: `src/mocks/handlers/cart.ts`
- alterar: `src/mocks/browser.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: identificação pela sessão ou por `X-Cart-Id`; `POST /cart/items` → `Cart`; `409 SOLD_OUT`, `422 QUANTITY_EXCEEDS_STOCK`) e docs/api-mock/persistencia.md ("`cart-<userId>`; o do visitante tem `id = ownerId = X-Cart-Id`")
- `src/mocks/db/cartAdd.ts`, `src/mocks/db/cartMerge.ts` (`userCartId`), `src/mocks/handlers/sessionGuard.ts` (`authenticate`, `readBearerToken`, `readCartId`), `src/schemas/common.ts` (`positiveIntSchema`)

## Instruções
1. `cartHandlers = [http.post(apiPath('/cart/items'), withMock('POST /cart/items', resolver))]` (sem `protected`: visitante pode).
2. Resolver: corpo não objeto → `BAD_REQUEST`; validar `{ nftId: string não vazia, editionId: string não vazia, quantity: positiveIntSchema }` (decimal ou < 1 → `422 VALIDATION_ERROR` com `fields`; use o `validationError` existente).
3. Dono do carrinho: se há cabeçalho `Authorization`, **`authenticate(request)`** (falhou → devolve a `Response`, assim `401 SESSION_EXPIRED` chega ao interceptor) e `{ cartId: userCartId(user.id), ownerId: user.id }`; senão `readCartId(request)`; ausente → `apiError('BAD_REQUEST', { message: 'Informe o carrinho do visitante.' })`; presente → `{ cartId, ownerId: cartId }`.
4. `addToCart`: `ok` → `200` com o carrinho **sem** `ownerId` (`{ id, items, itemCount, version, coupon? }`); `NOT_FOUND` → 404; `SOLD_OUT` → 409; `QUANTITY_EXCEEDS_STOCK` → 422 (com `message` e `details`).
5. `browser.ts`: importar e acrescentar `...cartHandlers` a `resourceHandlers`.
6. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/cart.ts src/mocks/browser.ts` e `git commit -m "06-018: handler POST /cart/items"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a resposta valida em `cartSchema` (sem vazar `ownerId`).
- [ ] Visitante com `X-Cart-Id` cria o carrinho com esse id; usuário logado grava em `cart-user-teste`; depois do login, o carrinho do visitante é mesclado como antes (05-005).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- auth-mock` continua verde.
- Coberto no 06-020.
