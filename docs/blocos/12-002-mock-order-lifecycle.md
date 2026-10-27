# 12-002 — Mock: ciclo de vida do pedido (confirmar ou recusar)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 2, 3, 4 (pendente → confirmado ou recusado)
**Depende de:** 12-001
**Toca:** `src/mocks/db/orderLifecycle.ts` (novo), `src/mocks/db/orderScenarios.ts` (alterar)
**Paralelo:** só com o mesmo agente (lote A). O 12-003 espera este.
**Lote:** A

## Objetivo
A lógica que tira o pedido de `pending`: decide o desfecho, gera `txHash` e `explorerUrl`, baixa o estoque, remove do carrinho **só os itens e quantidades comprados** e emite `order:updated`. Os handlers (12-003) só chamam estas funções.

## Arquivos
- criar: `src/mocks/db/orderLifecycle.ts`
- alterar: `src/mocks/db/orderScenarios.ts` (funções novas; as atuais não mudam)

## Referências
- docs/api-mock/contratos.md#ciclo-de-vida e #snapshot; docs/api-mock/cenarios.md (`payment-slow`, `payment-confirmed`, `payment-declined`, `realtime-drop`, `forbidden-order`); docs/api-mock/realtime.md (`order:updated`); docs/api-mock/persistencia.md (`orders` só muda `status`, `txHash`, `explorerUrl`, `declineReason`)
- `src/mocks/db/orderScenarios.ts` (`fire`, `hasScenario`), `mockConfig.paymentDelayMs` e `paymentDeclineRate` (`src/mocks/scenarios/config.ts`), `ordersStore`, `cartsStore`, `nftsStore` (`src/mocks/db/stores.ts`), `userCartId` (`cartMerge.ts`), `multiplyEth` (`money.ts`), `triggerStockChange` (`src/mocks/realtime/scheduler.ts`: grava e emite `nft:stock_changed`), `emitOrderUpdated` (`src/mocks/realtime/server.ts`), `buildExplorerUrl` (12-001), `OrderRecord`/`CartRecord` (`db.ts`)
- Padrão de gravação do carrinho: `removeItem` em `src/mocks/db/cartOps.ts` (recalcula `itemCount` e incrementa `version`)

## Instruções
1. `orderScenarios.ts`: acrescentar `'realtime-drop'` ao tipo `CheckoutScenario` e as funções:
   - `paymentDelayMs(): number` → `30_000` com `payment-slow`; senão `mockConfig.paymentDelayMs`.
   - `paymentOutcome(): 'confirmed' | 'declined'` → `payment-declined` ativo: `declined`; `payment-confirmed` ativo: `confirmed`; senão `Math.random() < mockConfig.paymentDeclineRate` → `declined`; senão `confirmed`.
   - `isForbiddenOrderScenario(): boolean` → `hasScenario('forbidden-order')` (vale em **toda** chamada, não só na primeira).
   - `shouldDropRealtime(): boolean` → `fire('realtime-drop')` (uma vez por carga da página) e `export const REALTIME_DROP_MS = 6000`.
2. `orderLifecycle.ts` (sem React; só `types`, `lib`, `schemas` e o próprio mock):
   - `export const DECLINE_REASON = 'Pagamento recusado pela carteira simulada.'` e uma constante local `STOCK_DECLINE_REASON = 'Um dos NFTs esgotou durante o pagamento.'`.
   - `newTxHash(): string`: `'0x'` + 64 hexadecimais de `crypto.getRandomValues` (32 bytes).
   - `settleOrder(orderId: string): Promise<OrderRecord | undefined>`: **uma só execução por pedido ao mesmo tempo** (`Map<string, Promise<…>>` em memória do módulo; chamadas concorrentes recebem a mesma promessa). Passos:
     1. Relê o registro em `ordersStore`; inexistente ou `status !== 'pending'` → devolve o registro como está.
     2. `outcome = paymentOutcome()`.
     3. `confirmed`: confere o estoque atual de cada item do **snapshot** (`nftsStore.get`; edição com `available !== null` e `available < quantity` → o pedido vira `declined` com `STOCK_DECLINE_REASON`, sem alterar estoque nem carrinho). Sem falta: para cada item de edição limitada, `triggerStockChange(nftId, editionId, available - quantity)` (edição aberta, `available === null`, não muda); depois `removePurchased` (abaixo); depois grava `{ ...record, status: 'confirmed', txHash: newTxHash(), explorerUrl: buildExplorerUrl(record.network, txHash) }` com `ordersStore.put` (o `put` só regrava os 4 campos de estado; o snapshot fica intacto).
     4. `declined`: grava `{ ...record, status: 'declined', declineReason: DECLINE_REASON }`; **não mexe em estoque nem em carrinho**.
     5. `emitOrderUpdated(id, { status, txHash? , declineReason? })` só com os campos definidos (sem `undefined` explícito). Devolve o registro novo.
   - `removePurchased(userId: string, items: OrderItemSnapshot[]): Promise<void>`: carrinho `cartsStore.get(userCartId(userId))` (sem carrinho: nada). Para cada item do snapshot, acha a linha por `nft.id` + `edition.id`; `quantity - comprado`: `> 0` mantém a linha com a quantidade nova e `lineTotal = multiplyEth(unitPrice, nova)`; `<= 0` remove a linha. O que o usuário adicionou **depois da cotação** (linhas novas ou quantidade a mais) continua. Recalcula `itemCount` e incrementa `version`. **Cupom (decisão Q4):** se o carrinho ficou sem itens, remover também `coupon`; se sobrou algo, o cupom fica.
   - `settleIfDue(record: OrderRecord): Promise<OrderRecord>`: se `pending` e `Date.now() >= Date.parse(record.createdAt) + paymentDelayMs()` → `await settleOrder(record.id) ?? record`; senão devolve `record`. Isto torna o mock **estável após refresh** (os timers do navegador somem ao recarregar; quem consulta recebe o estado certo).
   - `armSettlement(record: OrderRecord): void`: se `pending` e ainda não armado (`Set<string>` em memória), `setTimeout` para o tempo que falta (`createdAt + paymentDelayMs()` menos agora, mínimo 0) que chama `settleOrder(record.id)` (erros em `console.error`, nunca lançados). Idempotente.
3. Nenhum handler muda neste bloco.
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-002: ciclo de vida do pedido no mock" -- <arquivos>`.

## Critérios de aceite
- [ ] Duas chamadas simultâneas de `settleOrder` no mesmo pedido baixam o estoque **uma vez** e emitem **um** `order:updated`.
- [ ] Pedido confirmado: `txHash` com `0x` + 64 hexadecimais; `explorerUrl` no formato da rede do pedido; estoque da edição limitada reduzido; linhas compradas saem do carrinho e linhas/quantidades extras continuam.
- [ ] Pedido recusado: `declineReason` preenchido, carrinho e estoque intactos.
- [ ] `payment-slow` leva o atraso a 30 s; `payment-confirmed` e `payment-declined` forçam o desfecho.
- [ ] Snapshot (`items`, `subtotal`, `discount`, `networkFee`, `total`) nunca muda.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 12-017; recusa, estoque e carrinho com extras em detalhe no 12-020 (fase 13).
