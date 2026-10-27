# 13-055 — Perfil: acessibilidade de diálogos, erros e teclado

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-050 a 13-054
**Toca:** `tests/e2e/profile-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivo próprio).
**Lote:** T4
**Origem:** 09-016 (Acessibilidade)

Regras: 13-001.

## Casos
1. Axe com: diálogo de e-mail aberto, diálogo de remover avatar, erros visíveis e "Descartar alterações?".
2. Teclado: ordem dos campos, Enter envia, seletor de arquivo, diálogos com foco preso e retorno ao gatilho; `prefers-reduced-motion`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; axe sem `serious`/`critical`.
