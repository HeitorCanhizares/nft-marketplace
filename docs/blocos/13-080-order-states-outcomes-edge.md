# 13-080 — Confirmação: desfechos do pedido (`confirmed`, `declined`, estoque) e anúncios/foco

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/order-states-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T7
**Origem:** 12-020 (Estados do pedido)

Regras: 13-001. Pedidos criados por `seedOrder` ou pelo fluxo de pagamento; pendente exige `payment-slow` (30 s), senão confirma em 3 s.

## Casos
1. `payment-confirmed` e `payment-declined` forçados; `VITE_MOCK_PAYMENT_DECLINE_RATE` > 0 só é conferido no mock (`ordersStore`), sem depender de sorteio no navegador.
2. Recusado: `declineReason` exibido, "Seus itens continuam no carrinho", `GET /cart` igual antes e depois, **sem recibo e sem `txHash`**; "Voltar ao carrinho".
3. Recusa por estoque no momento da confirmação (a edição esgota entre a criação e o desfecho, pelo `nftsStore`): `declined` com "Um dos NFTs esgotou durante o pagamento.", estoque e carrinho intactos.
4. Cada transição anuncia o resultado em `assertive` ("Pedido confirmado" / "Pagamento recusado. <motivo>"); **o foco não sai do título** do diálogo; recibo e recusa nunca aparecem enquanto `pending`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
