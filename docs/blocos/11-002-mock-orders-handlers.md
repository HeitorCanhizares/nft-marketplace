# 11-002 — Handlers do mock: criar pedido e listar pendentes

**Status:** concluído
**Fluxo / subitem:** Pagamento › 1, 7, 8
**Depende de:** 11-001
**Toca:** `src/mocks/db/orderOps.ts` (novo), `src/mocks/handlers/orders.ts` (novo), `src/mocks/browser.ts` (alterar; **arquivo de registro**)
**Paralelo:** pode rodar com 11-004 a 11-011 (arquivos distintos). **Não** com 11-003 (mesmo `orders.ts`). `browser.ts` é arquivo de registro: só o lote A mexe nele.
**Lote:** A

## Objetivo
`POST /orders` com idempotência e revalidação da cotação, e `GET /orders?status=pending`, gravando no IndexedDB. O pedido nasce `pending` e **fica `pending`**: o ciclo de vida (confirmado/recusado, estoque, carrinho, tempo real, `GET /orders/:id`) é da fase 12.

## Arquivos
- criar: `src/mocks/db/orderOps.ts`
- criar: `src/mocks/handlers/orders.ts`
- alterar: `src/mocks/browser.ts` (importar e incluir `...ordersHandlers` em `resourceHandlers`)

## Referências
- docs/api-mock/contratos.md#pedidos (corpo, `201`/`200`, erros, Revalidação, Snapshot); docs/arquitetura/estado.md#criação-de-pedido-idempotente
- Padrão: `src/mocks/handlers/wallets.ts` e `quote.ts` (`withMock(..., { protected: true })`, `authenticate`, `apiError`, `validationError`, `apiPath`); `buildQuote` (`src/mocks/db/quote.ts`); `userCartId` (`src/mocks/db/cartMerge.ts`); `quotesStore`, `ordersStore` (`put`, `get`, `listByUserId`), `idempotencyStore` (`src/mocks/db/stores.ts`); `OrderRecord`, `IdempotencyRecord` (`src/mocks/db/db.ts`)
- `diffQuotes`, `toChangeCodes` (11-001), `createOrderInputSchema` (`src/schemas/order.ts`), `providerLabel` (`src/lib/walletOptions.ts`)

## Instruções
1. `orderOps.ts` (funções sem MSW):
   - `hashBody(body: unknown): Promise<string>`: SHA-256 (`crypto.subtle`) em hexadecimal do JSON com chaves ordenadas (`stableStringify` local).
   - `snapshotItems(quote: Quote): OrderItemSnapshot[]`: uma entrada por linha **não esgotada** (`nftId`, `name`, `tokenId`, `image`, `editionId`, `editionLabel`, `quantity`, `unitPrice`, `lineTotal`), copiadas da cotação.
   - `toOrder(record: OrderRecord): Order`: remove `userId`.
2. `orders.ts`, exportar `ordersHandlers`. Rotas com `withMock('POST /orders', …, { protected: true })` e `withMock('GET /orders', …, { protected: true })`; `authenticate` em ambas.
3. **`GET /orders`**: só `status=pending` é suportado (outro valor → `BAD_REQUEST`); devolve `ordersStore.listByUserId(user.id)` filtrado por `status === 'pending'`, mais recentes primeiro, com `toOrder`.
4. **`POST /orders`**, nesta ordem:
   1. Cabeçalho `Idempotency-Key` ausente ou vazio → `BAD_REQUEST`. Corpo que não for objeto → `BAD_REQUEST`; `createOrderInputSchema.safeParse` → `validationError`.
   2. **Idempotência:** `hash = hashBody(body)`. Se `idempotencyStore.get(key)` existe: mesmo `bodyHash` → `200` com o `Order` já gravado (sem criar outro); `bodyHash` diferente → `apiError('IDEMPOTENCY_KEY_REUSED')`.
   3. Cotação: `quotesStore.get(body.quoteId)`; inexistente ou `expiresAt` no passado → `apiError('QUOTE_EXPIRED')`.
   4. Carrinho: `cartsStore.get(userCartId(user.id))`; vazio ou `cart.version !== quote.cartVersion` → `apiError('CART_CHANGED')`.
   5. **Revalidação:** `fresh = await buildQuote(cart, { network: body.network })`; `entries = diffQuotes(stored, fresh)`; se `fresh` tem linha `sold_out` que não estava em `entries`, acrescentar `SOLD_OUT` dela. Se `entries` não está vazia → `apiError('QUOTE_CHANGED', { details: { quote: fresh, changes: toChangeCodes(entries) } })`. Se alguma linha de `fresh` está `insufficient` → `apiError('QUANTITY_EXCEEDS_STOCK')`.
   6. Cria o `OrderRecord` `pending` (`id = 'ord-' + crypto.randomUUID()`, `createdAt` agora, `quoteId`, `network`, `wallet: { label: providerLabel(body.provider), provider: body.provider, address: body.walletAddress }`, `collector: { ...body.collector, ...(body.note ? { note: body.note } : {}) }`, `items: snapshotItems(fresh)`, `subtotal`, `discount`, `coupon` só se `fresh.coupon?.status === 'applied'`, `networkFee`, `total`, `userId`). Grava com `ordersStore.put` e `idempotencyStore.put({ key, bodyHash, orderId, createdAt })`. Responde `201` com `toOrder`.
5. Não criar timer de confirmação, não mexer em estoque nem no carrinho, não emitir tempo real (fase 12).
6. `browser.ts`: registrar `...ordersHandlers`.
7. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit só dos 3 arquivos: `git commit -m "11-002: handlers de pedidos" -- <arquivos>`.

## Critérios de aceite
- [ ] Mesma chave e mesmo corpo duas vezes → um único pedido no `ordersStore` e a segunda resposta é `200`.
- [ ] Mesma chave com corpo diferente → `422 IDEMPOTENCY_KEY_REUSED`.
- [ ] Preço alterado depois da cotação → `409 QUOTE_CHANGED` com `details.quote` (id novo) e `details.changes`.
- [ ] O snapshot do pedido não muda se o preço do NFT mudar depois.
- [ ] Cada usuário só lista os próprios pedidos. Sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 11-018; erros e idempotência em detalhe: 11-020 (fase 13).
