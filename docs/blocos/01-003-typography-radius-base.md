# 01-003 — Escala tipográfica, raios e base

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Tokens (tipografia, raios, base)
**Depende de:** 01-002

## Objetivo
Definir os tamanhos de texto do Figma, os raios e os estilos-base (corpo, foco, movimento reduzido).

## Arquivos
- alterar: `src/styles/globals.css`

## Referências
- Figma `get_variable_defs` do frame `2:2` (escala abaixo)
- docs/design/tokens.md#raios e #layout-e-breakpoints; decisão A5
- docs/qualidade/acessibilidade.md (foco, `prefers-reduced-motion`)

## Instruções
1. Tamanhos de fonte (Figma), em `@theme`: `--text-tiny: 9px`, `--text-xs: 10px`, `--text-caption: 12px`, `--text-caption-md: 13px`, `--text-sm: 14px`, `--text-body: 15px`, `--text-base: 16px`, `--text-lg: 18px`, `--text-heading: 24px`, `--text-display: 43px`. A altura de linha **não** é token (varia por instância no Figma): cada componente aplica `leading-*` conforme a captura.
2. Pesos usados: 400, 500 e 700. Títulos de destaque (hero, "NFT EM DESTAQUE") em caixa alta e bold.
3. Raios: `--radius: 0.25rem` (4px, desktop); `--radius-sm/md/lg/xl` recalculados a partir dele. Acrescentar `--radius-mobile: 0.75rem` (campos e botões do mobile, ≈ 12px nas capturas) e `--radius-media: 0.75rem` (imagens dos NFTs). Os componentes usam `rounded-(--radius-mobile) lg:rounded-sm` onde o Figma difere entre mobile e desktop.
4. `@layer base`: `body` com `bg-background text-foreground font-sans antialiased`; `*` com `border-border`; foco global `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }`; em `@media (prefers-reduced-motion: reduce)`, desligar `scroll-behavior` suave e reduzir animações e transições a ≈ 0.
5. Container: `@utility container-page` com `max-width: 1200px; margin-inline: auto; padding-inline: 1.5rem` (mobile) e `padding-inline: 0` a partir de `lg`.
6. Tema único escuro: declarar `@custom-variant dark (&);` para que as classes `dark:` que a CLI do shadcn gera valham sempre (sem depender de `prefers-color-scheme`); os componentes novos não devem acrescentar `dark:` por conta própria.
7. Breakpoint: usar o `lg` padrão do Tailwind (1024px, decisão A5). Não criar outros.
Commit: `git add src/styles/globals.css` e `git commit -m "01-003: escala tipográfica, raios e base"`.

## Critérios de aceite
- [ ] Os 10 tamanhos existem e batem com o Figma.
- [ ] Foco visível em qualquer elemento interativo.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Sem `outline: none` sem substituto.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe: Tab mostra anel de 2px na cor `primary`; com `reducedMotion: 'reduce'` do Playwright, as transições ficam ≈ 0.
- `document.documentElement.scrollWidth <= innerWidth` em 320px no probe.
