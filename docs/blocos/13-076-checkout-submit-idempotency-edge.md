# 13-076 — Pagamento: envio idempotente, `order-timeout`, retentativa e recusa de assinatura

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/checkout-submit-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Envio idempotente)

Regras: 13-001.

## Casos
1. Clique repetido em "Confirmar compra" e em "Confirmar e pagar": **um** pedido (`recordApi` e `ordersStore` com 1 registro). `order-timeout`: "Confirmando seu pedido..." e chega ao pedido **sem duplicar** (o reenvio usa a mesma chave).
2. Falha de rede/5xx: 3 tentativas, depois "Não conseguimos confirmar seu pedido." + "Tentar novamente" reutilizando a chave **sem nova assinatura**.
3. `422 IDEMPOTENCY_KEY_REUSED` e `422 VALIDATION_ERROR` mostram mensagem e mantêm o formulário.
4. `wallet-sign-rejected`: "Pagamento cancelado na carteira", nenhum pedido; desconexão durante a assinatura; refresh no meio do envio recupera o pedido pelo `GET /orders?status=pending`; em toda falha: carrinho e formulário preservados (conferir `GET /cart`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; nenhum teste deixa pedido duplicado.
