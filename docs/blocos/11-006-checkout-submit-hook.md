# 11-006 — Hook de envio do pedido (assinatura, idempotência, reenvio)

**Status:** pendente
**Fluxo / subitem:** Pagamento › 8, 9
**Depende de:** 11-001, 11-004
**Toca:** `src/hooks/useCheckoutSubmit.ts` (novo)
**Paralelo:** pode rodar com 11-005, 11-007, 11-008, 11-010 (arquivos distintos).
**Lote:** F (junto com 11-008)

## Objetivo
Pedir a assinatura à carteira simulada e criar o pedido com `Idempotency-Key`, sem duplicar em clique repetido nem em reenvio.

## Arquivos
- criar: `src/hooks/useCheckoutSubmit.ts`

## Referências
- docs/arquitetura/estado.md#criação-de-pedido-idempotente (passos 1 a 7); docs/fluxos/pagamento.md subitens 8 e 9
- `src/hooks/useWallets.ts` (padrão da trava `locked` com promessa em andamento; refs **só em callbacks**), `createOrder`, `readQuoteChanged` (11-001), `readPending`, `writePending`, `setPendingOrderId`, `clearPending` (11-004), `getWalletProvider` (`src/services/wallet`), `isRetryable`/`isApiError` (`src/services/http/ApiError.ts`), `useLiveAnnouncer`

## Instruções
1. Tipos exportados:
```ts
export type SubmitPhase = 'idle' | 'signing' | 'sending' | 'confirming'
export type SubmitResult =
  | { kind: 'created'; order: Order }
  | { kind: 'changed'; quote: Quote }          // 409 QUOTE_CHANGED: usar a cotação nova
  | { kind: 'stale' }                           // 409 QUOTE_EXPIRED ou CART_CHANGED: refazer a cotação
  | { kind: 'cancelled'; message: string }      // assinatura recusada
  | { kind: 'failed'; message: string }         // demais falhas
export type SubmitInput = { userId: string; quote: Quote; request: Omit<CreateOrderInput, 'quoteId'> }
```
2. `useCheckoutSubmit()` devolve `{ submit(input: SubmitInput): Promise<SubmitResult>, phase: SubmitPhase, isSubmitting: boolean }`.
3. **Trava de clique repetido:** guardar a promessa em andamento num `useRef` (escrito só dentro de `submit`); enquanto houver uma, `submit` devolve **a mesma promessa** e não dispara nada.
4. Fluxo de `submit`:
   1. `pending = readPending(userId)`. Se existe e `pending.quoteId === quote.id`: **reaproveita** a chave e **não pede nova assinatura**. Senão: `key = crypto.randomUUID()`, `phase = 'signing'`, `await getWalletProvider()?.signOrder(quote.id)` (sem provedor → `failed` "Carteira indisponível."); erro com `code === 'SIGN_REJECTED'` → `cancelled` "Pagamento cancelado na carteira" (**nenhum pedido criado**, nada gravado); `DISCONNECTED` → `failed` "Carteira desconectada. Conecte novamente."; depois `writePending({ userId, quoteId: quote.id, key, request: { ...request, quoteId: quote.id } })`.
   2. `phase = 'sending'`; `createOrder(body, key)`. Em `NETWORK_ERROR`, `TIMEOUT` ou 5xx (`isRetryable`): até **3 tentativas no total** com a **mesma chave**, espera de 500 ms e depois 1000 ms (`setTimeout` em promessa); a partir da 2ª tentativa `phase = 'confirming'` ("Confirmando seu pedido...").
   3. Sucesso → `setPendingOrderId(order.id)` e `created` (quem chama navega).
   4. `QUOTE_CHANGED` → `readQuoteChanged(error)`; com cotação: `clearPending()` e `changed`. `QUOTE_EXPIRED` ou `CART_CHANGED` → `clearPending()` e `stale`.
   5. Outro erro, ou tentativas esgotadas → **mantém** o registro pendente (a chave) e devolve `failed` com a mensagem: `TIMEOUT`/`NETWORK_ERROR` → "Não conseguimos confirmar seu pedido."; demais → `error.message`.
   6. Ao terminar (qualquer resultado) `phase = 'idle'`. Anunciar `phase` com `useLiveAnnouncer` (`polite`): "Processando...", "Confirmando seu pedido...".
5. `SESSION_EXPIRED` não é tratado aqui (o interceptor do Axios já dispara a expiração; o registro pendente e o rascunho ficam no `sessionStorage`).
6. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit: `git commit -m "11-006: hook de envio do pedido" -- <arquivo>`.

## Critérios de aceite
- [ ] Duas chamadas seguidas de `submit` → uma só assinatura e uma só requisição em andamento (mesma promessa).
- [ ] Reenvio automático usa a **mesma** `Idempotency-Key`; depois do `409 QUOTE_CHANGED` a próxima tentativa (cotação nova) usa chave **nova**.
- [ ] Assinatura recusada → `cancelled`, `kurio:checkout` não é gravado.
- [ ] "Tentar novamente" depois de uma falha reutiliza a chave e **não** pede assinatura outra vez.
- [ ] Sem `any`, `as` ou `@ts-ignore`; sem `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 11-018; duplo clique, timeout e recusa no 11-020.
