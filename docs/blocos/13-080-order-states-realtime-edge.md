# 13-080 — Confirmação: estados do pedido, tempo real e polling

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-010, 13-011
**Toca:** `tests/e2e/order-confirmation-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T7
**Origem:** 12-020 (Estados do pedido, Tempo real, polling e reconexão)

Regras: 13-001. Pedidos criados por `seedOrder` ou pelo fluxo de pagamento; pendente exige `payment-slow` (30 s), senão confirma em 3 s.

## Estados do pedido
1. `payment-confirmed` e `payment-declined` forçados; `VITE_MOCK_PAYMENT_DECLINE_RATE` > 0 só é conferido no mock (`ordersStore`), sem depender de sorteio no navegador.
2. Recusado: `declineReason` exibido, "Seus itens continuam no carrinho", `GET /cart` igual antes e depois, **sem recibo e sem `txHash`**; "Voltar ao carrinho".
3. Recusa por estoque no momento da confirmação (a edição esgota entre a criação e o desfecho, pelo `nftsStore`): `declined` com "Um dos NFTs esgotou durante o pagamento.", estoque e carrinho intactos.
4. Cada transição anuncia o resultado em `assertive` ("Pedido confirmado" / "Pagamento recusado. <motivo>"); **o foco não sai do título** do diálogo; recibo e recusa nunca aparecem enquanto `pending`.

## Tempo real, polling e reconexão
5. `realtime-drop`: o socket cai com o pedido pendente, o polling de 2 s assume (`GET /orders/:id` repetido até sair de `pending`, contado com `recordApi` e `page.clock`), ao reconectar há uma releitura; com o socket conectado **não** há polling.
6. `order:updated` de outro pedido é ignorado; evento perdido (socket reconectou depois do desfecho) é recuperado pela releitura.
7. `payment-slow` com `createdAt` antigo (`seedOrder`): depois de 60 s **desde a criação** aparece "Está demorando mais que o normal. Você pode sair; o pedido continua sendo processado."; some quando sai de `pending`; botão "Voltar ao início".

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
