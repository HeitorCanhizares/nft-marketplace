# 13-020 — Início: hero (rotação automática, loop e pausa)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-hero-autoplay-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-060

Regras: 13-001 (§ Regras dos specs de borda).

## Casos
1. Rotação a cada 6 s com `page.clock.install()` + `runFor`: avança até o último slide e volta ao primeiro (loop); o slide ativo muda o `h2`, o `alt` da imagem e o indicador.
2. Pausa: mouse sobre o hero, foco dentro dele e botão "Pausar rotação dos destaques" param a rotação (o relógio avança e o slide não muda); soltar o mouse/tirar o foco retoma só se o botão não estiver em pausa manual; o botão alterna o nome para "Retomar rotação dos destaques" e `aria-pressed`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`; relógio controlado só com `page.clock`.
- [ ] Bugs encontrados viram blocos `13-1NN`.
