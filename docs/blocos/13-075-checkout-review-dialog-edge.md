# 13-075 — Pagamento: múltiplas mudanças, `QUOTE_EXPIRED`, foco na revisão e espelhamento

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/checkout-review-dialog-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Revisão e mudanças)

Regras: 13-001.

## Casos
1. Várias mudanças juntas numa só lista; `QUOTE_EXPIRED` e `CART_CHANGED` refazem a cotação sem perder o formulário.
2. Cada cenário forçado vale uma vez por carga da página (depois da nova confirmação o pedido é criado).
3. "Voltar" mantém dados e chave; Esc e clique fora bloqueados durante o envio; foco inicial no título e retorno do foco ao "Confirmar compra"; falha de rede ao revalidar mostra erro e permite tentar de novo.
4. A revisão mostra itens, carteira, taxa e total iguais à cotação (strings da API).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
