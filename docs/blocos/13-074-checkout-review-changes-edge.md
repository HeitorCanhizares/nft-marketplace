# 13-074 — Pagamento: revisão com mudanças forçadas (`price`, `sold-out`, `coupon`, `fee`)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/checkout-review-changes-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Revisão e mudanças), `cenarios.md` (4 cenários de mudança)

Regras: 13-001. Começa sempre pelo fluxo: conectar MetaMask → "Confirmar compra" → diálogo `[d]` / folha `[m]` "Revisar pedido".

## Casos
1. `price-change-on-checkout`: `QuoteChangeList` mostra valor antigo → novo, exige confirmar de novo e usa **chave de idempotência nova** (comparar o cabeçalho `Idempotency-Key` das duas tentativas `POST /orders`); `nft:price_changed` chega ao app.
2. `sold-out-on-checkout`: aviso no item, opção de remover na revisão; carrinho esvaziado → `/carrinho`; `nft:stock_changed`.
3. `coupon-expires-on-checkout`: revisão mostra o desconto removido; nova confirmação.
4. `fee-change-on-checkout`: taxa nova na revisão; nova confirmação.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
