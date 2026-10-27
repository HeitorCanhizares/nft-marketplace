# 13-035 — Detalhes: acessibilidade dos estados e modais

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-030 a 13-034
**Toca:** `tests/e2e/nft-details-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Acessibilidade)

Regras: 13-001.

## Casos
1. Axe (`serious`/`critical` = 0) com: zoom aberto, drawer de avaliações `[m]`, NFT esgotado, 404 e estado de erro.
2. Anúncio `polite` "Adicionado ao carrinho" verificado na região `aria-live`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; axe sem violações `serious`/`critical`.
