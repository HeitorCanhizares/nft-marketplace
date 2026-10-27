# 11-003 — Cenários do checkout no mock

**Status:** concluído
**Fluxo / subitem:** Pagamento › 7, 8, 10 (cenários de `cenarios.md`)
**Depende de:** 11-002
**Toca:** `src/mocks/db/orderScenarios.ts` (novo), `src/mocks/handlers/orders.ts` (alterar)
**Paralelo:** só com o mesmo agente do 11-002 (mesmo `orders.ts`); com os demais blocos pode rodar junto.
**Lote:** A

## Objetivo
Fazer o `POST /orders` obedecer aos cenários forçados do checkout. Os **testes** deles ficam para a fase 13 (11-020); aqui só o comportamento do mock.

## Arquivos
- criar: `src/mocks/db/orderScenarios.ts`
- alterar: `src/mocks/handlers/orders.ts` (chamadas novas na revalidação e no fim)

## Referências
- docs/api-mock/cenarios.md (linhas `price-change-on-checkout`, `sold-out-on-checkout`, `coupon-expires-on-checkout`, `fee-change-on-checkout`, `order-timeout`, `session-expired-on-checkout`)
- `hasScenario` (`src/mocks/scenarios/active.ts`), `wait` (`src/mocks/scenarios/latency.ts`), `HTTP_TIMEOUT_MS` (`src/services/http/client.ts`), `triggerPriceChange`, `triggerStockChange` (`src/mocks/realtime/scheduler.ts`), `ethToUnits`, `unitsToEth` (`src/mocks/db/money.ts`), `quotesStore`

## Instruções
1. `orderScenarios.ts`: estado em memória do módulo (some ao recarregar a página): `consumed: Set<string>` (cenário já disparado) e `forcedQuoteIds: Set<string>`. Funções:
   - `isForcedQuote(quoteId): boolean`.
   - `maybeSessionExpired(): boolean`: `session-expired-on-checkout` ativo e ainda não consumido → marca e devolve `true` (o handler responde `apiError('SESSION_EXPIRED')` **antes** de tudo, logo depois do `authenticate`).
   - `perturbBeforeRevalidation(stored: Quote): Promise<void>`: **uma vez** por cenário:
     - `price-change-on-checkout`: na primeira linha não esgotada, `triggerPriceChange(nft.id, edition.id, preço + 0.01)` (conta em unidades de `money.ts`); a revalidação normal vai achar o `PRICE_CHANGED`.
     - `sold-out-on-checkout`: `triggerStockChange(nft.id, edition.id, 0)` na primeira linha com estoque finito (`available !== null`); se nenhuma, não faz nada.
   - `forceQuoteChange(fresh: Quote): Promise<Quote | null>`: **uma vez** por cenário, e só se `fresh` ainda não for forçada: `coupon-expires-on-checkout` (só com `fresh.coupon?.status === 'applied'`): devolve cópia com `coupon.status = 'expired'`, `discount` zero e `total` recalculado; `fee-change-on-checkout`: `networkFee` + `0.001` e `total` recalculado. A cotação devolvida recebe `id` novo, é gravada em `quotesStore` e o id entra em `forcedQuoteIds`. Sem cenário → `null`.
   - `holdAfterCreate(key: string): Promise<void>`: `order-timeout` ativo e a chave ainda não consumida → `await wait(HTTP_TIMEOUT_MS + 3000)` (o pedido **já foi gravado**; o Axios estoura o tempo e a nova tentativa com a mesma chave cai na idempotência).
2. `orders.ts`, no `POST /orders`: (a) depois de `authenticate`, `if (maybeSessionExpired()) return apiError('SESSION_EXPIRED')`; (b) antes do passo 5 (revalidação) chamar `perturbBeforeRevalidation(stored)` **e pular a revalidação inteira** se `isForcedQuote(body.quoteId)` (a cotação forçada é a verdade do cenário; o pedido usa `stored` no lugar de `fresh`); (c) depois do `buildQuote`, se `forceQuoteChange(fresh)` devolver uma cotação, responder `409 QUOTE_CHANGED` com ela (`changes` por `diffQuotes(stored, forçada)`); (d) depois de gravar o pedido e a idempotência, `await holdAfterCreate(key)` e só então responder `201`.
3. Cenário não ativo → comportamento do 11-002 inalterado.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git commit -m "11-003: cenários do checkout no mock" -- <arquivos>`.

## Critérios de aceite
- [ ] Com cada cenário ativo, a primeira tentativa recebe o `409` (ou `401`/atraso) e a segunda, com a cotação nova, cria o pedido.
- [ ] `order-timeout`: a resposta demora mais que `HTTP_TIMEOUT_MS`, mas o pedido existe e a mesma chave devolve o mesmo pedido, sem duplicar.
- [ ] Sem cenário ativo nada muda. Sem `any`, `as` ou `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Cenários testados na fase 13.
