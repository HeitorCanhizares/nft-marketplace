# 00-020 — Configuração do Playwright (desktop e mobile)

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Playwright (projetos desktop e mobile)
**Depende de:** 00-019, 00-015

## Objetivo
Configurar o Playwright com os projetos `desktop` (1440×900) e `mobile` (414×896, toque), servindo o build de preview em modo `test`.

## Arquivos
- criar: `playwright.config.ts`
- alterar: `package.json` (script `test:e2e`), `tsconfig.node.json` (incluir `playwright.config.ts` e `tests`)

## Referências
- docs/qualidade/testes.md#configuração
- docs/api-mock/cenarios.md (`.env.test`)
- Decisão A5 (breakpoint 1024px: 1440 é desktop, 414 é mobile)

## Instruções
1. `playwright.config.ts` com `defineConfig`:
   - `testDir: './tests'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: 0`, `reporter: [['list'], ['html', { open: 'never' }]]`.
   - `use`: `baseURL: 'http://localhost:4173'`, `locale: 'pt-BR'`, `serviceWorkers: 'allow'` (o MSW é um service worker), `trace: 'on-first-retry'`.
   - `projects`:
     - `desktop`: `...devices['Desktop Chrome']` com `viewport: { width: 1440, height: 900 }`.
     - `mobile`: `...devices['Pixel 7']` com `viewport: { width: 414, height: 896 }` (mantém `isMobile` e `hasTouch`).
   - `webServer`: `command: 'npm run build:test && npm run preview -- --port 4173 --strictPort'`, `url: 'http://localhost:4173'`, `reuseExistingServer: !process.env.CI`, `timeout: 180_000`.
2. `package.json`: script `test:e2e` → `playwright test`.
3. `tsconfig.node.json`: acrescentar `playwright.config.ts` e `tests` ao `include`.
4. Não definir projetos de Firefox/WebKit nem de visual (fase 13 e fases de fluxo).
5. Commit: `git add playwright.config.ts package.json tsconfig.node.json` e `git commit -m "00-020: configuração do Playwright"`.

## Critérios de aceite
- [ ] Exatamente dois projetos: `desktop` e `mobile`.
- [ ] O servidor sobe com o build `--mode test` (usa o `.env.test`).
- [ ] `npm run typecheck` cobre `playwright.config.ts`.

## Verificação (Sonnet)
- `npx playwright test --list` lista os projetos `desktop` e `mobile` (sem testes ainda: o 00-021 adiciona o primeiro).
- `npm run lint && npm run format:check && npm run typecheck` → exit 0.
- `npm run build:test` → exit 0.
