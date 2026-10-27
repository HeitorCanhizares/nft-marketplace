# 13-022 — Início: hero e destaque (skeleton sem CLS, erro `/home` e `alt` das imagens)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-hero-states-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-060

Regras: 13-001 (§ Regras dos specs de borda).

## Casos
1. Esqueleto do hero com `slow`: mesma altura do conteúdo final (450 px desktop / 190 px mobile, ± 1 px), sem salto (CLS) ao trocar.
2. `server-error:GET /home` e `offline`: um único `ErrorState` com "Tentar novamente"; clicar refaz `GET /home` e mostra a Início (cenário forçado só na primeira vez via `failApi(..., { times: 1 })`).
3. Todas as imagens do hero e do destaque têm `alt` não vazio vindo da API (`alt` decorativo `""` só nos indicadores/ícones).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
- [ ] Bugs encontrados viram blocos `13-1NN`.
