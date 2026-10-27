# 12-003 — Mock: `GET /orders/:id`, agendamento e cenários do pedido

**Status:** concluído
**Fluxo / subitem:** Confirmação › 2, 3, 4, 7
**Depende de:** 12-002
**Toca:** `src/mocks/handlers/orders.ts` (alterar)
**Paralelo:** só com o mesmo agente (lote A). `browser.ts` **não** muda: `ordersHandlers` já está registrado.
**Lote:** A

## Objetivo
Expor o pedido por id (com 403 e 404), fazer o pedido sair de `pending` sozinho e ligar os cenários `forbidden-order` e `realtime-drop`.

## Arquivos
- alterar: `src/mocks/handlers/orders.ts`

## Referências
- docs/api-mock/contratos.md#pedidos (`GET /orders/:id`: `404`, `403 FORBIDDEN`), #ciclo-de-vida; docs/api-mock/cenarios.md (`forbidden-order`, `realtime-drop`, `payment-slow`); docs/api-mock/realtime.md
- Padrão de rota com parâmetro: `GET /nfts/:id` em `src/mocks/handlers/nfts.ts` (`withMock('GET /nfts/:id', …)`, `params.id`); `authenticate`, `apiError`; `dropConnections` (`src/mocks/realtime/server.ts`)
- `settleIfDue`, `armSettlement` (12-002); `isForbiddenOrderScenario`, `shouldDropRealtime`, `REALTIME_DROP_MS` (12-002); `toOrder`

## Instruções
1. **`GET /orders/:id`** (`withMock('GET /orders/:id', …, { protected: true })`, `apiPath('/orders/:id')`), nesta ordem:
   1. `authenticate`.
   2. `isForbiddenOrderScenario()` → `apiError('FORBIDDEN', { message: 'Você não tem acesso a este pedido.' })`.
   3. `ordersStore.get(id)`: inexistente → `apiError('NOT_FOUND', { message: 'Pedido não encontrado.' })`; `record.userId !== auth.user.id` → o mesmo `FORBIDDEN` do passo 2.
   4. Pedido `pending` e `shouldDropRealtime()` → `dropConnections(REALTIME_DROP_MS)` (o polling assume; ao reconectar o front refaz o `GET`).
   5. `settled = await settleIfDue(record)`; se continua `pending`, `armSettlement(settled)`.
   6. `HttpResponse.json(toOrder(settled))`. Nunca devolve `userId`.
2. **`GET /orders?status=pending`** (já existe): antes de filtrar, aplicar `settleIfDue` em cada pedido do usuário e chamar `armSettlement` nos que continuam `pending`. Assim, depois de um refresh, a lista de pendentes nunca mostra um pedido que já devia ter saído de `pending`.
3. **`POST /orders`** (já existe): logo depois de gravar o pedido e a idempotência (e **antes** de `holdAfterCreate`), chamar `armSettlement(record)`. Nada mais muda na criação.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit: `git commit -m "12-003: GET /orders/:id e agendamento" -- <arquivo>`.

## Critérios de aceite
- [ ] Pedido de outro usuário → `403 FORBIDDEN`; id inexistente → `404 NOT_FOUND`; com `forbidden-order` qualquer id → `403`.
- [ ] Pedido criado sai de `pending` depois de `VITE_MOCK_PAYMENT_DELAY_MS` mesmo **sem nenhum `GET` no intervalo** (timer armado na criação) e também depois de um refresh (`GET` arma o timer ou liquida na hora).
- [ ] `GET /orders?status=pending` não devolve pedido que já passou do prazo.
- [ ] Com `realtime-drop`, a primeira consulta de um pedido pendente derruba o socket por `REALTIME_DROP_MS` e o `GET` continua respondendo.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 12-017; 403, 404, refresh, `realtime-drop` e recusa no 12-020 (fase 13).
