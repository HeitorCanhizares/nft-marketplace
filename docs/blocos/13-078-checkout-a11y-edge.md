# 13-078 — Pagamento: acessibilidade da revisão, estados e breakpoint 1024 px

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-070 a 13-077
**Toca:** `tests/e2e/checkout-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Estados e acessibilidade)

Regras: 13-001.

## Casos
1. Axe com a revisão aberta e com lista de mudanças; `slow` (skeleton), `server-error` e rede nos carregamentos.
2. Teclado (ordem dos campos, rádios, "⋮", `Dialog`/`Sheet` com foco preso e retorno); anúncios (conexão, mudanças, "Processando..."); `[d]` ↔ `[m]` no meio do fluxo mantém o estado; 1024 a 1439 px (layout mobile abaixo de 1024, desktop a partir dele); contraste de `muted-foreground` sobre `card`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; axe sem `serious`/`critical`.
