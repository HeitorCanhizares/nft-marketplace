# 08-001 — Mock: preço atual, `PATCH` e `DELETE` de itens do carrinho

**Status:** pendente
**Fluxo / subitem:** Carrinho › 2 (alterar quantidade), 3 (remover), 7 (preço e estoque atuais)
**Depende de:** 07-017, 06-069

## Objetivo
`GET /cart` passa a devolver o **preço atual** de cada linha, e nascem `PATCH /cart/items/:itemId` e `DELETE /cart/items/:itemId`.

## Arquivos
- criar: `src/mocks/db/cartOps.ts`
- alterar: `src/mocks/handlers/cart.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: `PATCH` → `409 SOLD_OUT`, `422 QUANTITY_EXCEEDS_STOCK`, `404`; quantidades inteiras ≥ 1) e cenarios.md
- `src/mocks/db/cartAdd.ts` (modelo de `CartRecord`, `multiplyEth`, `LOW_STOCK_THRESHOLD`), `src/mocks/db/money.ts`, `src/mocks/scenarios/errors.ts` (`apiError`, `validationError`), `src/lib/maxQuantity.ts` (`MAX_PER_PURCHASE` = 99)

## Instruções
1. **Regra de preço (proposta do Sonnet, confirmar com o usuário):** a `unitPrice` **gravada** na linha é o preço que o usuário **viu** por último; ela não muda sozinha. O `GET /cart` e o `POST /quote` leem o preço **atual** da edição (`nftsStore`). A diferença vira `priceChanged` na cotação (bloco 08-003). `PATCH` da linha (o usuário agiu sobre ela) regrava a `unitPrice` com o preço atual.
2. Criar `cartOps.ts` (sem React; só lógica do mock) com:
   - `availabilityOf(available, quantity)` (mesma regra do handler atual: `sold_out` com 0, `insufficient` se `available < quantity`, `low_stock` se `available <= 3`, senão `available`; `null` → `available`). Remover a cópia local do handler e importar daqui.
   - `toCartResponse(record: CartRecord): Promise<Cart>`: para cada linha, lê o NFT e a edição, devolve a linha com `available`, `availability`, **`unitPrice` = preço atual da edição** e `lineTotal = multiplyEth(preço atual, quantity)`; linha cujo NFT não existe mais é omitida (edição que sumiu mantém os valores gravados). `itemCount` = soma das `quantity`. Sem `ownerId`, validando em `cartSchema`. **Não grava.**
   - `updateItemQuantity(cartId, itemId, quantity)` e `removeItem(cartId, itemId)`, devolvendo uma união `{ ok: true, cart } | { ok: false, code, message, details? }`.
3. `updateItemQuantity`: carrinho ou linha inexistente → `NOT_FOUND`; edição com `available === 0` → `SOLD_OUT`; `available !== null && quantity > available` → `QUANTITY_EXCEEDS_STOCK` com `details: { available, inCart: quantidade atual da linha }`; `available === null && quantity > MAX_PER_PURCHASE` → `QUANTITY_EXCEEDS_STOCK` com `details: { available: 99, inCart }`. Sucesso: regrava `quantity`, `unitPrice` (preço atual), `lineTotal`, `available`, `availability`, `version + 1`, `itemCount`; `cartsStore.put`.
4. `removeItem`: tira a linha, recalcula `itemCount`, `version + 1`, `put` (carrinho vazio continua gravado). Linha inexistente → `NOT_FOUND`.
5. Handlers em `cart.ts` (mesma identificação do dono do `POST`: **exportar** o `resolveOwner` já existente, que o 08-003 reutiliza; dono ausente → `BAD_REQUEST` "Informe o carrinho do visitante."):
   - `http.patch(apiPath('/cart/items/:itemId'), withMock('PATCH /cart/items/:itemId', …))`, corpo `{ quantity: positiveIntSchema }` (decimal, zero e negativo → `422 VALIDATION_ERROR` via `validationError`).
   - `http.delete(apiPath('/cart/items/:itemId'), withMock('DELETE /cart/items/:itemId', …))`.
   - Respostas: `HttpResponse.json(await toCartResponse(record))` (`Cart`).
6. Trocar o corpo do `GET /cart` e a resposta do `POST /cart/items` por `toCartResponse` (o `empty-cart` e o visitante sem `X-Cart-Id` continuam como estão).
7. Fechamento: `npx prettier --write src/mocks/db/cartOps.ts src/mocks/handlers/cart.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-001: itens do carrinho no mock`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem conta de ETH fora de `money.ts`.
- [ ] `PATCH` com `quantity` acima do estoque → `422 QUANTITY_EXCEEDS_STOCK` com `details.available`; edição zerada → `409 SOLD_OUT`; id inexistente → `404`; `1.5` → `422 VALIDATION_ERROR`.
- [ ] `GET /cart` depois de mudar o preço da edição no banco devolve o preço novo e o `lineTotal` novo; `PATCH` da linha regrava o preço gravado.
- [ ] Carrinho de visitante (`X-Cart-Id`) e de usuário (`Authorization`) funcionam nas duas rotas novas; token vencido → `401 SESSION_EXPIRED`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento coberto no spec do 08-013.
