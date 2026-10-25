# 01-002 — Fonte Roboto Mono

**Status:** pendente
**Fluxo / subitem:** Fase 01 › Tokens (fonte)
**Depende de:** 01-001

## Objetivo
Carregar a Roboto Mono (variável, self-hosted) como fonte de toda a interface.

## Arquivos
- alterar: `src/styles/globals.css`, `package.json`
- gerado pelo npm: `package-lock.json`

## Referências
- docs/design/tokens.md#tipografia; decisão A8 (confirmada no Figma: `font/family` = Roboto Mono)
- docs/qualidade/lighthouse.md (`font-display: swap`)
- Dependência `@fontsource-variable/roboto-mono` aprovada pelo usuário em 2026-10-25

## Instruções
1. `npm install @fontsource-variable/roboto-mono`.
2. `globals.css`: `@import "@fontsource-variable/roboto-mono";` (o pacote já usa `font-display: swap`).
3. No `@theme inline`: `--font-sans: 'Roboto Mono Variable', ui-monospace, monospace;` e `--font-mono` igual. Remover `--font-heading` ou apontá-lo para `--font-sans`; nenhuma referência à Geist.
4. **Não** adicionar `<link rel="preload">` agora (é da fase 13, Lighthouse).
Commit: `git add package.json package-lock.json src/styles/globals.css` e `git commit -m "01-002: fonte Roboto Mono"`.

## Critérios de aceite
- [ ] Toda a interface renderiza em Roboto Mono (inclusive botões e campos).
- [ ] Nenhuma requisição a domínios externos de fonte.
- [ ] Sem Geist em lugar nenhum.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe: `getComputedStyle(document.body).fontFamily` contém `Roboto Mono Variable` e `document.fonts.check('16px "Roboto Mono Variable"')` é `true`.
- Aba de rede: só requisições à própria origem.
