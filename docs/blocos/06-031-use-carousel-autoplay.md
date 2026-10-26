# 06-031 — Hook `useCarouselAutoplay` (rotação com pausa)

**Status:** pendente
**Fluxo / subitem:** Início › 1 (hero automático; para com hover, foco, `prefers-reduced-motion` e pelo botão)
**Depende de:** 04-001, 01-013
**Depende de decisão:** pergunta 7 do relatório da fase 06

## Objetivo
Criar a lógica de rotação automática de um carrossel do Embla, com as quatro condições de parada exigidas pela WCAG 2.2.2.

## Arquivos
- criar: `src/hooks/useCarouselAutoplay.ts`

## Referências
- docs/fluxos/inicio.md (subitem 1: "troca a cada 6s; para com hover, com foco dentro do carrossel e quando `prefers-reduced-motion` está ativo"; botão de pausar/retomar) e docs/qualidade/acessibilidade.md ("Respeitar `prefers-reduced-motion` nos carrosséis (sem autoplay)")
- `src/components/ui/carousel.tsx` (`CarouselApi`; **sem autoplay no primitivo**), `src/hooks/useMediaQuery.ts` (`useMediaQuery`)

## Instruções
1. `useCarouselAutoplay(api: CarouselApi | undefined, options?: { intervalMs?: number })` (padrão **6000**) devolve:
   - `reducedMotion: boolean` (`useMediaQuery('(prefers-reduced-motion: reduce)')`);
   - `userPaused: boolean` e `toggle(): void` (botão de pausar/retomar);
   - `running: boolean` = `api` existe **e** `!userPaused` **e** `!hovering` **e** `!focusWithin` **e** `!reducedMotion`;
   - `containerProps`: `{ onMouseEnter, onMouseLeave, onFocusCapture, onBlurCapture }` para espalhar no container (`onBlurCapture` só zera o foco quando o próximo foco **sai** do container: usar `relatedTarget` e `currentTarget.contains`).
2. Quando `running`, um `setTimeout` (reiniciado a cada `select` do Embla e a cada mudança de `running`) chama `api.scrollNext()` depois de `intervalMs`; limpar o timer ao parar e ao desmontar. Com `loop` desligado no último slide, voltar com `api.scrollTo(0)`.
3. Sem dependência nova (nada de `embla-carousel-autoplay`). Export nomeado.
4. Fechamento: `npx prettier --write src/hooks/useCarouselAutoplay.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useCarouselAutoplay.ts` e `git commit -m "06-031: hook useCarouselAutoplay"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; troca a cada 6 s com o relógio simulado (`page.clock`).
- [ ] Para (e retoma) com hover, foco dentro, botão e `prefers-reduced-motion: reduce`; com reduced motion **nunca** avança sozinho.
- [ ] Nenhum timer fica vivo depois de desmontar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-060.
