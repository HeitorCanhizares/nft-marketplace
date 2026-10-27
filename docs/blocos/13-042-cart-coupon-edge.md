# 13-042 — Carrinho: cupons (inválido, expirado, cálculo exato e persistência)

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-coupon-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Cupom)

Regras: 13-001.

## Casos
1. `COUPON_INVALID` (código desconhecido) e `COUPON_EXPIRED` (`EXPIRADO`): mensagem ligada ao campo (`aria-describedby`), foco no campo, valores sem desconto.
2. `GENESIS5` (5 %) e `KURIO10` (10 %): o desconto exibido é `floor(subtotal × % / 100)` em unidades de 0,000001 ETH, igual à string da cotação; código normalizado (`trim` + maiúsculas, `  kurio10 `).
3. Campo vazio só valida no envio; "Remover cupom" volta ao total sem desconto; cupom persiste a refresh e segue ao login (o do visitante prevalece se o usuário não tinha).
4. Cupom que venceu depois de aplicado: a cotação traz `coupon.status: 'expired'`, sem desconto e aviso no campo.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile` (painel fixo e cupom embutido `[m]`).
