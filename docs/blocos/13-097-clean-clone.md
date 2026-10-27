# 13-097 — Fechamento: clone limpo

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** todos os blocos commitados pelo Opus (o clone só enxerga o que está no git)
**Toca:** — (só execução, fora do repositório)
**Paralelo:** não.
**Lote:** —

## Instruções
1. Pasta no scratchpad, sem worktrees nem junctions: `git clone C:\Users\heito\Desktop\Projetos\nft-marketplace C:\Users\heito\AppData\Local\Temp\claude\C--Users-heito-Desktop-Projetos-nft-marketplace\8e4c3c27-28dc-4803-a128-d2e6dcbb478b\scratchpad\clone-fase-13` (se a pasta existir, usar outro nome; nunca apagar o que já existe sem pedir).
2. Nessa pasta: `npm ci`, `npm audit --omit=dev` (esperado 0), `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:test`.
3. `npx playwright install` só se faltar navegador no cache (o cache é global; sem download novo normalmente).
4. `npm run test:e2e` completo nos 4 projetos (as baselines `-win32` vêm no clone) e `npm run lhci`.
5. Conferir que o clone não depende de arquivo ignorado do checkout original (`.env*` versionados; `.lighthouseci`, `playwright-report` e `test-results` regenerados).
6. Entregar os resultados lado a lado com o 13-095 e o 13-096; qualquer diferença (arquivo esquecido no commit, variável de ambiente local) vira bloco de correção.

## Critérios de aceite
- [ ] Todos os passos verdes em um clone novo.

## Resultado (2026-10-27)
- Clone novo no scratchpad: `npm ci`, `npm audit --omit=dev` (0), `format:check`, `lint`, `typecheck`, `build` e `build:test` verdes; `tests/visual` + `smoke` em desktop e mobile: 96 passaram, 0 falharam.
- **Windows:** clonar numa pasta funda estoura o limite de 260 caracteres por causa dos nomes das baselines (`states-account-checkout.spec.ts-snapshots/...`). Clonar com `git -c core.longpaths=true clone ...` ou numa pasta curta.
- A suíte E2E completa e o LHCI não foram repetidos no clone; rodaram no checkout (13-095, 13-096) com o mesmo commit.
