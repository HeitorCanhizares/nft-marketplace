# 00-019 — Instalar Playwright e axe

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Playwright
**Depende de:** 00-018

## Objetivo
Instalar o Playwright, o `@axe-core/playwright` (A7) e o navegador Chromium.

## Arquivos
- nenhum arquivo de código; só `package.json` e `package-lock.json`

## Referências
- docs/qualidade/testes.md#configuração
- docs/decisoes.md (A7: `@axe-core/playwright`)

## Instruções
1. `npm install -D @playwright/test @axe-core/playwright`.
2. `npx playwright install chromium` (baixa o navegador; é esperado). **Só Chromium**: Firefox e WebKit entram na fase 13.
3. Não rodar `npm init playwright` (ele cria arquivos de exemplo e config próprios).
4. Commit: `git add package.json package-lock.json` e `git commit -m "00-019: instala Playwright e axe"`.

## Critérios de aceite
- [ ] Os dois pacotes em `devDependencies`.
- [ ] Nenhum arquivo novo no projeto (nada de `tests-examples/`, `playwright.config.ts` etc.).

## Verificação (Sonnet)
- `npx playwright --version` responde.
- `npm ls @playwright/test @axe-core/playwright` limpo.
- `git status --short` limpo.
