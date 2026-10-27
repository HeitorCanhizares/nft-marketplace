# 13-043 — Carrinho: resumo, cotação por rede e item esgotado fora do subtotal

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-quote-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Resumo e cotação)

Regras: 13-001.

## Casos
1. Resumo em atualização (`aria-busy`) enquanto recalcula; `server-error:GET /cart/quote` mostra "Tentar novamente" no resumo.
2. **Valores exibidos idênticos às strings da API** (`GET /cart/quote`) para vários carrinhos e redes (Ethereum `0.016`, Polygon `0.002`, Solana `0.0005`; carrinho vazio `0.00`): comparar texto da tela com a resposta.
3. Esgotado fica fora do subtotal (total riscado e texto para leitor de tela); `insufficient` entra com a quantidade pedida.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
