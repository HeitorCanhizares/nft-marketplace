# 13-082 — Confirmação: retomada no refresh, redirecionamento de `/pagamento` e recusa → Pagamento

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/order-resume-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T7
**Origem:** 12-020 (Retomada e recuperação, recusa → Pagamento), 13-013 (decisão Q2: caminho A)

Regras: 13-001.

## Casos
1. Refresh em `/pedido/<id>` pendente retoma o acompanhamento e o desfecho chega depois do refresh (timer rearmado pelo `GET`; mock estável).
2. `/pagamento` com pedido pendente redireciona ao pedido (por `kurio:checkout.orderId` e por `GET /orders?status=pending`); depois do desfecho **não** redireciona (confirmado: carrinho vazio → `/carrinho`; recusado: Pagamento livre).
3. Sai com o pedido pendente, o pedido confirma fora, volta por `/pagamento` e cai no recibo; `kurio:checkout` limpo ali. Recibo antigo aberto durante um pagamento novo **não** apaga o `kurio:checkout` novo. `order-timeout`: reenvio com a mesma chave chega ao mesmo pedido, sem duplicar, e acompanha até o desfecho.
4. Pagar com MetaMask → `payment-declined` → "Tentar novamente" → `/pagamento`: conferir **(a)** campos do colecionador, modo, observação, rede e provedor **iguais aos de antes**, `kurio:checkout` apagado e o próximo `POST /orders` com chave **diferente**; **(b)** estado da conexão **"Não conectada"** com o provedor do rascunho em destaque (decisão Q2: caminho A).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
