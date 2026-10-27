# 12-004 — Estado da conexão do socket (`useSocketConnected`)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 2 (polling quando o socket cai)
**Depende de:** —
**Toca:** `src/services/realtime/socket.ts` (alterar), `src/hooks/useSocketConnected.ts` (novo)
**Paralelo:** pode rodar com os lotes A, C e D da onda 1. O 12-011 espera este. **Atenção:** `socket.ts` é usado por todo o tempo real (catálogo, carrinho); o comportamento atual não pode mudar.
**Lote:** B (mesmo agente de 12-005)

## Objetivo
Saber, em React, se o socket está conectado agora, para o pedido pendente ligar o polling de 2 s só enquanto o socket estiver fora.

## Arquivos
- alterar: `src/services/realtime/socket.ts`
- criar: `src/hooks/useSocketConnected.ts`

## Referências
- docs/api-mock/realtime.md ("Se o socket cair, o pedido ainda pode ser acompanhado por polling em `GET /orders/:id` (a cada 2s)"); docs/arquitetura/estado.md#recuperação-de-pedido-pendente
- `src/services/realtime/socket.ts` (`socket.on('connect')`, `socket.on('disconnect')`, `onReconnect`, `droppedSinceLastConnect`)

## Instruções
1. `socket.ts`: acrescentar, sem alterar nada do que existe:
```ts
export function isSocketConnected(): boolean            // socket.connected
export function onSocketConnection(handler: (connected: boolean) => void): () => void  // devolve o cancelamento
```
   - Guardar os handlers num `Set` (padrão de `reconnectHandlers`). Nos `socket.on('connect')` e `socket.on('disconnect')` **já existentes**, **depois** da lógica atual, chamar os handlers com `true` / `false` (o `disconnect` notifica qualquer motivo, inclusive `io client disconnect` do login e do logout).
   - `onReconnect` continua igual (só dispara depois de uma queda).
2. `src/hooks/useSocketConnected.ts`: `useSocketConnected(): boolean` com `useSyncExternalStore((notify) => onSocketConnection(() => { notify() }), isSocketConnected)`. Sem `useState`, sem `useEffect`, sem `ref`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-004: estado da conexão do socket" -- <arquivos>`.

## Critérios de aceite
- [ ] Socket conectado → `true`; depois de `dropConnections` no mock → `false` e, na volta, `true` (o componente re-renderiza nas duas trocas).
- [ ] O catálogo, o carrinho e o login continuam como antes (specs `home` e `cart` verdes: `npm run test:e2e -- home cart`).
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build, `npm run test:e2e -- cart`. Comportamento do polling no 12-017 e no 12-020 (`realtime-drop`).
