# 13-006 — Configuração do LHCI para todas as páginas e metas

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** —
**Toca:** `lighthouserc.json` (alterar); se a Q5 for "script de login", um arquivo de script do LHCI (**arquivo novo fora de `docs/arquitetura/pastas.md`**, só com a resposta do usuário)
**Paralelo:** sim (arquivos distintos dos blocos de teste).
**Lote:** D

## Objetivo
Auditar o que `qualidade/lighthouse.md` pede: `/`, `/nft/emerald-ape-042`, `/carrinho`, `/entrar` e, logado, `/pagamento` e `/perfil/dados`. Hoje o `lighthouserc.json` audita só `/` e todas as metas são `warn`.

## Instruções
1. `collect.url`: as 4 públicas (porta 4174, build `build:test`, latência 50 ms).
2. `assert`: `categories:performance` ≥ 0,9; `accessibility` = 1; `best-practices` ≥ 0,95; `seo` ≥ 0,9; `largest-contentful-paint` ≤ 2500; `cumulative-layout-shift` ≤ 0,1; `interaction-to-next-paint` (se existir no relatório) ≤ 200. Nível `error` ao fechar a fase; durante o trabalho pode ficar `warn`.
3. Logadas: conforme a Q5 (script de login com o `puppeteer-core` que já vem no `@lhci/cli`, ou só as públicas, documentado). O token fica no `localStorage`; o script entra com o `users.primary` lendo a credencial de `tests/e2e/fixtures.ts` (não repetir o valor).
4. `numberOfRuns: 3`.
5. O Opus atualiza `lighthouse.md` dizendo que a nota inclui o custo do MSW e do seed.

## Critérios de aceite
- [ ] `npm run lhci` audita as páginas pedidas e grava em `.lighthouseci/`.
- [ ] As asserções refletem a tabela de metas.
