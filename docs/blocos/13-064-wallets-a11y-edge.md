# 13-064 — Carteiras: acessibilidade de diálogos, erros e anúncios

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-060 a 13-063
**Toca:** `tests/e2e/wallets-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivo próprio).
**Lote:** T5
**Origem:** 10-012 (Acessibilidade)

Regras: 13-001.

## Casos
1. Axe com diálogos de remover e de trocar abertos e erros visíveis.
2. Anúncios "Carteira principal salva", "Carteira secundária salva", "Carteira secundária removida" e "Carteiras trocadas"; teclado (Radix `Select`, rádio, diálogos).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; axe sem `serious`/`critical`.
