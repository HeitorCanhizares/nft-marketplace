# 05-042 — Ponte de teste: ampliações da fase 05

**Status:** concluído
**Responsável:** Sonnet (infraestrutura de teste)
**Fluxo / subitem:** Fase 05 › Testes
**Depende de:** 05-001, 05-002, 05-025, 05-026, 05-034

## Objetivo
Expor em `window.__kurio` (só em `MODE === 'test'`) o que os testes da fase 05 precisam e hoje não alcançam: schemas de auth, funções do `redirect`, mensagens de ajuste, ação pendente e o roteador.

## Arquivos
- alterar (infraestrutura de teste, só o Sonnet): `src/app/TestBridge.tsx`

## Referências
- `src/app/TestBridge.tsx` (padrão da ponte: `schemas`, `session`, `socket`, `wallet`…; **sem UI**; sai do build de produção) e docs/decisoes.md (ponte `window.__kurio` só em modo `test`, aprovada na fase 03)
- **Confirmar com o usuário** (mesma ponte; só amplia)

## Instruções
1. `schemas.auth` (`src/schemas/auth.ts`).
2. `redirect` (`parseRedirect`, `validateAuthSearch`, `isProtectedPath`, `closeTarget`), `cartAdjustments` (`describeAdjustment`, `describeAdjustments`) e `pendingAction` (`savePendingAction`, `readPendingAction`, `clearPendingAction`, `registerPendingExecutor`, `runPendingAction`).
3. `router` (`import { router } from '@/app/router'`), para os testes lerem `router.state.location` e navegarem sem recarregar.
4. Atualizar o tipo `KurioTestApi` e manter o import dinâmico (`TestBridge` só carrega em modo `test`).
5. Fechamento: `npx prettier --write src/app/TestBridge.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build && npm run build:test` → exit 0; `grep -r __kurio dist/` continua **vazio** no build de produção. Commit: `git add src/app/TestBridge.tsx` e `git commit -m "05-042: ponte de teste da fase 05"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nada exposto fora de `MODE === 'test'`.
- [ ] `window.__kurio.schemas.auth`, `.redirect`, `.cartAdjustments`, `.pendingAction` e `.router` existem no build de teste.

## Verificação (Sonnet)
- `npm run test:e2e` → os testes anteriores continuam verdes.
