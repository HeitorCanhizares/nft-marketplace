# 13-002 — Projetos Firefox e WebKit no Playwright

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `playwright.config.ts` (alterar; **arquivo de registro**, lote A)
**Paralelo:** não.
**Lote:** A

## Objetivo
Rodar a suíte E2E completa também no Firefox e no WebKit, **no desktop** (`qualidade/testes.md`: Firefox e WebKit não rodam a regressão visual).

## Instruções
1. Instalar os binários: `npx playwright install firefox webkit` (download de algumas centenas de MB; só depois do OK do usuário, Q1). Nenhuma dependência nova: `@playwright/test` já está no `package.json`. Hoje só o Chromium está instalado.
2. Acrescentar dois projetos a `projects`: `firefox` (`devices['Desktop Firefox']`, viewport 1440 × 900) e `webkit` (`devices['Desktop Safari']`, 1440 × 900), ambos com `testIgnore: '**/visual/**'`.
3. Os projetos `desktop` e `mobile` ficam como estão (Chromium). **A regressão visual continua só no Chromium** (baselines `-win32`): acrescentar `testIgnore` aos novos, não `testMatch` aos antigos.
4. `npm run test:e2e -- --project=firefox --project=webkit --list` lista os specs sem os de `tests/visual/`.

## Critérios de aceite
- [ ] `--list` nos 4 projetos: nenhum spec de `tests/visual/` em Firefox ou WebKit.
- [ ] `npm run test:e2e -- smoke --project=firefox --project=webkit` roda (pode falhar por causa do `SvgIcon`: tratado no 13-003 e no 13-012).

## Verificação
- Smoke nos 4 projetos; `typecheck` e `lint` verdes.
