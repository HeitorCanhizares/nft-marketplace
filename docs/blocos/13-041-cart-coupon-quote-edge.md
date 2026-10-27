# 13-041 — Carrinho: cupom, resumo e cotação

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-coupon-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T3
**Origem:** 08-015 (Cupom, Resumo e cotação)

Regras: 13-001.

## Cupom
1. `COUPON_INVALID` (código desconhecido) e `COUPON_EXPIRED` (`EXPIRADO`): mensagem ligada ao campo (`aria-describedby`), foco no campo, valores sem desconto.
2. `GENESIS5` (5 %) e `KURIO10` (10 %): o desconto exibido é `floor(subtotal × % / 100)` em unidades de 0,000001 ETH, igual à string da cotação; código normalizado (`trim` + maiúsculas, `  kurio10 `).
3. Campo vazio só valida no envio; "Remover cupom" volta ao total sem desconto; cupom persiste a refresh e segue ao login (o do visitante prevalece se o usuário não tinha).
4. Cupom que venceu depois de aplicado: a cotação traz `coupon.status: 'expired'`, sem desconto e aviso no campo.

## Resumo e cotação
5. Resumo em atualização (`aria-busy`) enquanto recalcula; `server-error:GET /cart/quote` mostra "Tentar novamente" no resumo.
6. **Valores exibidos idênticos às strings da API** (`GET /cart/quote`) para vários carrinhos e redes (Ethereum `0.016`, Polygon `0.002`, Solana `0.0005`; carrinho vazio `0.00`): comparar texto da tela com a resposta.
7. Esgotado fica fora do subtotal (total riscado e texto para leitor de tela); `insufficient` entra com a quantidade pedida.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile` (painel fixo e cupom embutido `[m]`).
