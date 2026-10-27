# 13-070 — Pagamento: guardas de entrada, pedido pendente existente e erros de carga

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/checkout-entry-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Entrada)

Regras: 13-001. Carrinho: `seedFigmaCart` como visitante e depois login (a mescla traz os itens).

## Casos
1. Sem login: `/entrar?redirect=/pagamento`; item esgotado ou com estoque insuficiente: `/carrinho` com o motivo; `empty-cart`: `/carrinho`.
2. Pedido pendente por `kurio:checkout.orderId` e por `GET /orders?status=pending`: vai a `/pedido/<id>`; chave de idempotência **sem** `orderId` reenvia o `POST /orders` com a mesma chave e o mesmo corpo (pedido existe / não existe).
3. `server-error` em carrinho, carteiras ou pendentes: `ErrorState` com "Tentar novamente".

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
