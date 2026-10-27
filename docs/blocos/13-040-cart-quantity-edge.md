# 13-040 — Carrinho: quantidade, debounce de `PATCH`, erros de estoque e `422`

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/cart-quantity-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Quantidade), `testes.md` (Carrinho)

Regras: 13-001. Carrinho de partida: `seedFigmaCart` (Emerald Ape ×2, Violet Nomad, Ivory Baron).

## Casos
1. "-" desabilitado em 1; "+" desabilitado no limite com "Máximo disponível: N"; edição ABERTA com teto de 99; quantidade otimista só em `quantity`/`itemCount` e valores monetários com `aria-busy` até a resposta.
2. Cliques rápidos viram **um** `PATCH` com o valor final (debounce ~400 ms, `recordApi`); clique repetido na lixeira e em "Aplicar": uma requisição.
3. `PATCH` com `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK`: valor desfeito, aviso e dados atualizados; 5xx e rede: desfaz e avisa.
4. Decimal, zero e negativo rejeitados pelo mock (`422`, chamada direta pelo `window.__kurio.http`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
