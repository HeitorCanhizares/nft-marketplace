# 04-005 — Margem lateral do `container-page` entre 1024 e 1247 px

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Base de layout
**Depende de:** 03-020

## Objetivo
Evitar que o conteúdo encoste nas bordas da janela entre 1024 e 1247 px: hoje o utilitário zera o padding a partir de `lg` (1024), mas o container de 1200 px só deixa de precisar de margem a partir de 1248 px (1200 + 2 × 24).

## Arquivos
- alterar: `src/styles/globals.css`

## Referências
- docs/design/tokens.md#layout-e-breakpoints (container de 1200 px, margem de 24–28 px no mobile)
- docs/qualidade/acessibilidade.md (sem rolagem horizontal, zoom de 200%)

## Instruções
1. No `@utility container-page`, manter `max-width: 1200px`, `margin-inline: auto` e `padding-inline: 1.5rem`.
2. Trocar o `@variant lg { padding-inline: 0; }` por `@media (min-width: 1248px) { padding-inline: 0; }`.
3. Não mexer em mais nada do arquivo.
4. Fechamento: `npx prettier --write src/styles/globals.css`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/styles/globals.css` e `git commit -m "04-005: margem do container-page até 1247px"`.

## Critérios de aceite
- [ ] Em 1440 px o conteúdo continua com 1200 px (margem de 120 px de cada lado).
- [ ] Em 1100 px há 24 px de margem de cada lado.
- [ ] Em 414 px a margem continua de 24 px.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** com um `div.container-page` e medição de `getBoundingClientRect()` em 414, 1024, 1100, 1247, 1248 e 1440 px.
