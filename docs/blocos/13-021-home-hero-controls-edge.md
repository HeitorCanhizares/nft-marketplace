# 13-021 — Início: hero (movimento reduzido, controles manuais e CTA Explorar)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-hero-controls-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-060

Regras: 13-001 (§ Regras dos specs de borda).

## Casos
1. `prefers-reduced-motion: reduce` (`page.emulateMedia`): sem autoplay e sem o botão de pausa; setas, indicadores e swipe `[m]` continuam trocando o slide.
2. Setas (`ArrowLeft`/`ArrowRight` com foco no carrossel) e indicadores por teclado; `[m]` swipe (arrastar horizontal) troca o slide.
3. "EXPLORAR" leva a `#catalogo` e o foco vai ao título do catálogo (`useCatalogFocus`); a URL fica com o hash.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
- [ ] Bugs encontrados viram blocos `13-1NN`.
