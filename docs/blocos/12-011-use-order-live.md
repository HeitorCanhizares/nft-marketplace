# 12-011 — Hooks `useOrder` e `useOrderLive` (consulta, polling e tempo real)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 1, 2 (acompanhar por `order:updated`, polling a cada 2 s, refazer o `GET` ao reconectar)
**Depende de:** 12-001, 12-004
**Toca:** `src/hooks/useOrder.ts` (novo), `src/hooks/useOrderLive.ts` (novo)
**Paralelo:** pode rodar com os lotes E e J (arquivos distintos). `queryKeys.ts` **não** muda (`orders.detail(id)` e `orders.pending` já existem). O 12-012 espera este (mesmo agente).
**Lote:** F

## Objetivo
A consulta do pedido (com polling de 2 s enquanto está pendente e o socket está fora) e a ligação com o socket: inscrição no pedido, `order:updated` e releitura ao (re)conectar.

## Arquivos
- criar: `src/hooks/useOrder.ts`
- criar: `src/hooks/useOrderLive.ts`

## Referências
- docs/api-mock/realtime.md (`order:subscribe`, `order:updated`, polling, reconexão invalida as queries afetadas); docs/arquitetura/estado.md#recuperação-de-pedido-pendente ("Em `/pedido/$orderId`: acompanha por `order:updated`; se o socket cair, polling a cada 2s; ao reconectar, refaz o `GET`")
- Padrão: `nftDetailOptions` e `useNftDetail` em `src/hooks/useNftDetail.ts` (`queryOptions`); `useCartLive.ts` (efeitos de socket com cancelamento); `src/hooks/queryKeys.ts` (`orders`)
- `getOrder` (12-001), `useSocketConnected` e `onSocketConnection` (12-004), `subscribeOrder`, `onSocketEvent` (`src/services/realtime/socket.ts`)

## Instruções
1. `src/hooks/useOrder.ts`:
   - `export const ORDER_POLL_MS = 2000`.
   - `export function orderOptions(orderId: string)` → `queryOptions({ queryKey: orders.detail(orderId), queryFn: ({ signal }) => getOrder(orderId, signal), staleTime: 0 })` (o `loader` da rota usa `queryClient.fetchQuery(orderOptions(id))`, 12-015).
   - `export function useOrder(orderId: string)` → `useQuery({ ...orderOptions(orderId), refetchOnMount: 'always', refetchInterval: (query) => (query.state.data?.status === 'pending' && !socketConnected ? ORDER_POLL_MS : false) })`, com `socketConnected = useSocketConnected()` lido no render do hook. O polling **só liga com o pedido pendente e o socket fora**; com o socket conectado, quem atualiza é o `order:updated`. 4xx não tenta de novo (regra global do `queryClient`). Falha num ciclo de polling mantém o último dado na tela.
2. `src/hooks/useOrderLive.ts`: `useOrderLive(orderId: string, status: OrderStatus | undefined): void`. Os três efeitos só valem com `status === 'pending'` (dependência: `isPending = status === 'pending'`):
   - **Inscrição:** `subscribeOrder(orderId)` (o `socket.ts` guarda e reenvia a cada conexão; o protocolo não tem cancelamento de pedido).
   - **Evento:** `onSocketEvent('order:updated', (payload) => …)`: ignora `payload.orderId !== orderId`; senão `invalidateQueries({ queryKey: orders.detail(orderId) })` e `invalidateQueries({ queryKey: orders.pending })`. A **releitura do `GET`** é a fonte da verdade (traz `explorerUrl` e o snapshot completo, que o payload não tem); o recibo só aparece depois dela. Devolve o cancelamento no cleanup.
   - **Conexão:** `onSocketConnection((connected) => { if (connected) invalidate detail })`. Cobre a **primeira** conexão depois do carregamento da página e **toda reconexão** (o `socket.ts` reenvia as inscrições antes de notificar, então a releitura já vem com o pedido inscrito). Cleanup cancela.
3. Mudanças em tempo real **nunca** movem o foco nem trocam o layout de lugar (docs/api-mock/realtime.md); estes hooks só mexem no cache.
4. Sem `ref` lido no render; sem estado duplicado.
5. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente em andamento, esperar e repetir, sem mexer nele). Commit só dos 2: `git commit -m "12-011: useOrder e useOrderLive" -- <arquivos>`.

## Critérios de aceite
- [ ] Pedido pendente com o socket conectado: nenhuma requisição de polling; um `order:updated` do pedido refaz o `GET` e o estado muda.
- [ ] Socket fora (`dropConnections`): `GET /orders/:id` a cada 2 s até sair de `pending`; ao reconectar, uma releitura.
- [ ] Evento de outro pedido não dispara nada. Pedido confirmado ou recusado não liga polling nem inscrição.
- [ ] Sem `any`, `as`, `!`, `@ts-ignore` nem `eslint-disable`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Caminho principal no 12-017; polling com socket caído e reconexão no 12-020 (fase 13).
