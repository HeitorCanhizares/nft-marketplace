# 13-046 — Carrinho: acessibilidade dos estados, teclado e painel mobile 320 px

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-040 a 13-045
**Toca:** `tests/e2e/cart-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Acessibilidade)

Regras: 13-001.

## Casos
1. Axe: carrinho com aviso de preço, com item esgotado, vazio e erro. Teclado: ordem lista → resumo, Enter em "Aplicar", lixeiras e steppers; leitor: anúncios de remoção, cupom e preço.
2. Painel mobile com cupom, erro e resumo ao mesmo tempo em 320 px sem overflow horizontal.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; axe sem `serious`/`critical`.
