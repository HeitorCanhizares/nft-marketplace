# 13-072 — Pagamento: revisão e mudanças que pedem nova confirmação

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-070
**Toca:** `tests/e2e/checkout-review-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T6
**Origem:** 11-020 (Revisão e mudanças), `cenarios.md` (4 cenários de mudança)

Regras: 13-001. Começa sempre pelo fluxo: conectar MetaMask → "Confirmar compra" → diálogo `[d]` / folha `[m]` "Revisar pedido".

## Casos
1. `price-change-on-checkout`: `QuoteChangeList` mostra valor antigo → novo, exige confirmar de novo e usa **chave de idempotência nova** (`recordApi` compara o cabeçalho `Idempotency-Key` das duas tentativas); `nft:price_changed` chega ao app.
2. `sold-out-on-checkout`: aviso no item, opção de remover na revisão; carrinho esvaziado → `/carrinho`; `nft:stock_changed`.
3. `coupon-expires-on-checkout`: revisão mostra o desconto removido; nova confirmação.
4. `fee-change-on-checkout`: taxa nova na revisão; nova confirmação.
5. Várias mudanças juntas numa só lista; `QUOTE_EXPIRED` e `CART_CHANGED` refazem a cotação sem perder o formulário.
6. Cada cenário vale uma vez por carga da página (depois da nova confirmação o pedido é criado).
7. "Voltar" mantém dados e chave; Esc e clique fora bloqueados durante o envio; foco inicial no título e retorno do foco ao "Confirmar compra"; falha de rede ao revalidar mostra erro e permite tentar de novo.
8. A revisão mostra itens, carteira, taxa e total iguais à cotação (strings da API).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.
