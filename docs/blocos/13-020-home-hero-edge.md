# 13-020 — Início: casos de borda do hero e do destaque

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-010, 13-011
**Toca:** `tests/e2e/home-hero-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-060

Regras: 13-001 (§ Regras dos specs de borda).

## Casos
1. Rotação a cada 6 s com `page.clock.install()` + `runFor`: avança até o último slide e volta ao primeiro (loop); o slide ativo muda o `h2`, o `alt` da imagem e o indicador.
2. Pausa: mouse sobre o hero, foco dentro dele e botão "Pausar rotação dos destaques" param a rotação (o relógio avança e o slide não muda); soltar o mouse/tirar o foco retoma só se o botão não estiver em pausa manual; o botão alterna o nome para "Retomar rotação dos destaques" e `aria-pressed`.
3. `prefers-reduced-motion: reduce` (`page.emulateMedia`): sem autoplay e sem o botão de pausa; setas, indicadores e swipe `[m]` continuam trocando o slide.
4. Setas (`ArrowLeft`/`ArrowRight` com foco no carrossel) e indicadores por teclado; `[m]` swipe (arrastar horizontal) troca o slide.
5. "EXPLORAR" leva a `#catalogo` e o foco vai ao título do catálogo (`useCatalogFocus`); a URL fica com o hash.
6. Esqueleto do hero com `slow`: mesma altura do conteúdo final (450 px desktop / 190 px mobile, ± 1 px), sem salto (CLS) ao trocar.
7. `server-error:GET /home` e `offline`: um único `ErrorState` com "Tentar novamente"; clicar refaz `GET /home` e mostra a Início (cenário forçado só na primeira vez via `failApi(..., { times: 1 })`).
8. Todas as imagens do hero e do destaque têm `alt` não vazio vindo da API (`alt` decorativo `""` só nos indicadores/ícones).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`; relógio controlado só com `page.clock`.
- [ ] Bugs encontrados viram blocos `13-1NN`.
