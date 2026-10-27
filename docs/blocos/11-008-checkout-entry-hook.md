# 11-008 — Hook de entrada do Pagamento (pedido pendente, carrinho bloqueado)

**Status:** concluído
**Fluxo / subitem:** Pagamento › 1
**Depende de:** 11-001, 11-004
**Toca:** `src/hooks/useCheckoutEntry.ts` (novo)
**Paralelo:** pode rodar com 11-005, 11-006, 11-007, 11-010.
**Lote:** F (depois do 11-006)

## Objetivo
Decidir o que fazer ao abrir `/pagamento`: seguir para um pedido pendente, descobrir um pedido cujo envio caiu antes da resposta, voltar ao carrinho se ele não pode fechar, ou liberar a tela.

## Arquivos
- criar: `src/hooks/useCheckoutEntry.ts`

## Referências
- docs/fluxos/pagamento.md subitem 1; docs/arquitetura/estado.md#recuperação-de-pedido-pendente
- `src/hooks/useCart.ts`, `src/lib/cartCheckout.ts` (`getCheckoutState`), `getPendingOrders`, `createOrder` (11-001), `readPending`, `setPendingOrderId`, `clearPending` (11-004), `src/contexts/auth.ts` (`useAuth`), `sonner` (`toast`)

## Instruções
1. `useCheckoutEntry(): { status: 'checking' | 'ready'; cart: Cart | undefined; isCartError: boolean; retryCart: () => void }`.
2. Dados: `useCart()`; `useQuery({ queryKey: orders.pending, queryFn: ({ signal }) => getPendingOrders(signal) })` (`orders` de `queryKeys.ts`, `staleTime: 0`, `refetchOnMount: 'always'`); `readPending(user.id)` lido uma vez no efeito.
3. Um `useEffect` decide, **nesta ordem**, só quando o carrinho e a lista de pendentes estiverem carregados:
   1. Há pedido pendente na lista **ou** `readPending(...).orderId` → `navigate({ to: '/pedido/$orderId', params: { orderId }, replace: true })`.
   2. Há `readPending(...)` com chave **sem** `orderId` (o envio caiu antes da resposta) → `createOrder(pending.request, pending.key)`: sucesso → `setPendingOrderId(order.id)` e navega como no passo 1; qualquer erro → `clearPending()` e segue.
   3. `getCheckoutState(items).canCheckout === false` → `toast.error(reason)` e `navigate({ to: '/carrinho', replace: true })`.
   4. Senão `status = 'ready'`.
4. Efeito protegido contra execução dupla (StrictMode): usar o estado `status` e `cancelled` local do efeito; navegar **uma vez**. Erro ao carregar o carrinho ou os pendentes: `isCartError = true` (a página mostra `ErrorState`); `retryCart` refaz as duas consultas.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0 (se falhar por arquivo de **outro** agente, esperar e repetir). Commit: `git commit -m "11-008: entrada do pagamento" -- <arquivo>`.

## Critérios de aceite
- [ ] Carrinho vazio, com item esgotado ou com estoque insuficiente → vai a `/carrinho` com o motivo em `toast`.
- [ ] Pedido pendente (sessão ou `GET /orders?status=pending`) → `/pedido/$orderId` sem passar pela tela do pagamento.
- [ ] Chave sem `orderId` reenvia o `POST /orders` com a mesma chave e o mesmo corpo.
- [ ] Sem `any`, `as` ou `@ts-ignore`; sem `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Carrinho vazio e pedido pendente: caminho principal no 11-018; reenvio com chave e demais no 11-020.
