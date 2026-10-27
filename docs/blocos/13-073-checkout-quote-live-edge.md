# 13-073 — Pagamento: expiração da cotação, tempo real nos itens e cupom

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/checkout-quote-live-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Cotação, cupom e tempo real)

Regras: 13-001.

## Casos
1. Cotação vence (`VITE_MOCK_QUOTE_TTL_SECONDS` ou `page.clock`) e é refeita sozinha; erro da cotação (`PriceSummary` com "Tentar novamente").
2. `triggerPriceChange` e `triggerStockChange` atualizam a coluna de itens e o total; cupom inválido, expirado e remoção.
3. A **rede única** vale para cotação e conexão: `[d]` campo "Rede" do formulário; `[m]` rede da carteira salva escolhida.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
