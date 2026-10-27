# 11-001 — Contrato de pedidos no front (diff de cotação, serviço, schemas)

**Status:** concluído
**Fluxo / subitem:** Pagamento › 6, 7, 8
**Depende de:** —
**Toca:** `src/lib/quoteDiff.ts` (novo), `src/services/api/orders.ts` (novo), `src/schemas/order.ts` (alterar)
**Paralelo:** pode rodar com 11-004, 11-009, 11-011. Os blocos 11-002, 11-005, 11-006, 11-008 e 11-010 esperam este.
**Lote:** A (mesmo agente de 11-002 e 11-003)

## Objetivo
Uma função pura que compara duas cotações (usada pelo front e pelo mock) e o serviço HTTP de pedidos e da cotação do checkout.

## Arquivos
- criar: `src/lib/quoteDiff.ts`
- criar: `src/services/api/orders.ts`
- alterar: `src/schemas/order.ts`

## Referências
- docs/api-mock/contratos.md#pedidos (`POST /orders`, `409 QUOTE_CHANGED` com `details.quote` e `details.changes`, `GET /orders?status=pending`)
- docs/arquitetura/estado.md#criação-de-pedido-idempotente
- `src/types/order.ts` (`QuoteChange`, `Order`, `CreateOrderInput`), `src/types/cart.ts` (`Quote`), `src/services/api/cart.ts` (padrão de `get`/`post`), `src/services/http/ApiError.ts` (`isApiError`)

## Instruções
1. `src/lib/quoteDiff.ts` (função pura, **sem React**, sem importar de `mocks/`):
```ts
export type QuoteChangeEntry =
  | { kind: 'PRICE_CHANGED'; itemId: string; name: string; from: string; to: string }
  | { kind: 'SOLD_OUT'; itemId: string; name: string }
  | { kind: 'COUPON_EXPIRED'; code: string }
  | { kind: 'FEE_CHANGED'; from: string; to: string }
export function diffQuotes(before: Quote, after: Quote): QuoteChangeEntry[]
export function toChangeCodes(entries: readonly QuoteChangeEntry[]): QuoteChange[] // sem repetição, na ordem
```
   Regras de `diffQuotes` (ordem da lista: preço, esgotado, cupom, taxa):
   - linhas casadas por `item.id`; `PRICE_CHANGED` quando `unitPrice` difere e a linha nova não está esgotada (`from` = antes, `to` = depois); `name` = `item.nft.name`;
   - `SOLD_OUT` quando a linha nova é `availability === 'sold_out'` e a antiga não era;
   - `COUPON_EXPIRED` quando `before.coupon?.status === 'applied'` e `after.coupon?.status !== 'applied'` (`code` = `before.coupon.code`);
   - `FEE_CHANGED` quando `networkFee` difere.
   Linha que existe só em um dos lados é ignorada (carrinho mudou: o servidor trata como `CART_CHANGED`).
2. `src/schemas/order.ts`: acrescentar `ordersSchema = z.array(orderSchema)` e `quoteChangedDetailsSchema = z.object({ quote: quoteSchema, changes: z.array(quoteChangeSchema) })` (importar `quoteSchema` de `@/schemas/cart`). Não mexer no resto.
3. `src/services/api/orders.ts` (usar `get`/`post` de `@/services/http/validate`):
   - `createOrder(input: CreateOrderInput, idempotencyKey: string, signal?: AbortSignal): Promise<Order>`: `POST /orders` com o cabeçalho `Idempotency-Key`; valida com `orderSchema` (200 e 201 valem).
   - `getPendingOrders(signal?): Promise<Order[]>`: `GET /orders` com `params: { status: 'pending' }`, valida com `ordersSchema`.
   - `getCheckoutQuote(input: { network?: Network; provider?: WalletProvider }, signal?): Promise<Quote>`: `POST /quote` com o corpo `input` (o servidor já aceita), valida com `quoteSchema`. Não alterar `services/api/cart.ts`.
   - `readQuoteChanged(error: unknown): Quote | null`: se `isApiError(error)`, `error.code === 'QUOTE_CHANGED'` e `quoteChangedDetailsSchema.safeParse(error.details)` passa, devolve `data.quote`; senão `null`.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 3 arquivos: `git commit -m "11-001: contrato de pedidos no front" -- <arquivos>`.

## Critérios de aceite
- [ ] `quoteDiff.ts` sem importar React nem `mocks/`; sem `any`, sem `as`, sem `@ts-ignore`.
- [ ] Duas cotações iguais → lista vazia; preço de uma linha subiu → uma entrada `PRICE_CHANGED` com antes e depois; cupom `applied` → `expired` → `COUPON_EXPIRED`; taxa diferente → `FEE_CHANGED`.
- [ ] `createOrder` envia `Idempotency-Key`; `getPendingOrders` envia `status=pending`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 11-018.
