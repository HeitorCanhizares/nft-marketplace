# 00-018 — Pastas vazias de `mocks/`, `public/` e `tests/visual/`

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Estrutura de pastas aprovada (mock, public, testes)
**Depende de:** 00-017

## Objetivo
Completar a árvore aprovada com as pastas do mock, a `public/` e a de regressão visual.

## Arquivos
- criar (somente `.gitkeep`, não contam como código):
  - `src/mocks/handlers/`, `src/mocks/db/`, `src/mocks/seed/`, `src/mocks/scenarios/`, `src/mocks/realtime/`, `src/mocks/wallet/`
  - `public/`
  - `tests/visual/`

## Referências
- docs/arquitetura/pastas.md

## Instruções
1. Criar cada pasta acima com um `.gitkeep` vazio.
2. **Não** criar `src/mocks/browser.ts` nem `public/mockServiceWorker.js` (fase 02), nem `tests/e2e/` (nasce com o teste de fumaça, 00-021).
3. Commit: `git add src/mocks public tests` e `git commit -m "00-018: pastas vazias de mocks, public e tests"`.

## Critérios de aceite
- [ ] As 8 pastas existem, cada uma com `.gitkeep`.
- [ ] Nenhum outro arquivo no commit.

## Verificação (Sonnet)
- `git diff --stat HEAD~1` → 8 `.gitkeep`.
- Árvore final de `src/` (pastas) idêntica à de `pastas.md`: `app`, `routes`, `pages`, `components/{ui,layout,shared}`, `contexts`, `hooks`, `services/{http,api,realtime,wallet}`, `schemas`, `types`, `lib`, `mocks/{handlers,db,seed,scenarios,realtime,wallet}`, `styles`, `assets`.
- `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
