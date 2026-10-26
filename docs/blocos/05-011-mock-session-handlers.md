# 05-011 — Mock: `GET /auth/session`, `POST /auth/refresh` e `POST /auth/logout`

**Status:** concluído
**Fluxo / subitem:** Login › 5, 6 e 7 (sessão recuperada, renovação, logout)
**Depende de:** 05-006, 05-010

## Objetivo
Implementar no mock as três rotas protegidas da sessão: recuperar o usuário pelo token, renovar a sessão e encerrá-la.

## Arquivos
- alterar: `src/mocks/handlers/auth.ts`

## Referências
- docs/api-mock/contratos.md (`GET /auth/session` 🔒 `200 { user, expiresAt }`; `POST /auth/refresh` 🔒 `200 { session }`; `POST /auth/logout` 🔒 `204`) e docs/api-mock/cenarios.md (`session-expired`: qualquer rota 🔒 responde `401 SESSION_EXPIRED`; falhas aleatórias **nunca** atingem `GET /auth/session`)
- `src/mocks/scenarios/middleware.ts` (`withMock(routeKey, resolver, { protected, exemptFromRandomFailures })`), `src/mocks/handlers/sessionGuard.ts`
- `src/contexts/AuthContext.tsx` (usa `getSession`, `refreshSession` e `logout`)

## Instruções
1. `GET /auth/session`: `withMock('GET /auth/session', …, { protected: true, exemptFromRandomFailures: true })`. `authenticate(request)`; resposta `200 { user: toPublicUser(user), expiresAt: session.expiresAt }`. A sessão **não** é estendida.
2. `POST /auth/refresh`: `{ protected: true }`. `authenticate`; **apaga** o registro antigo (`sessionsStore.delete(token)`), cria outro com `createSession(user.id)` (token novo, TTL cheio) e responde `200 { session: { token, expiresAt } }`.
3. `POST /auth/logout`: `{ protected: true }`. Lê o token com `readBearerToken`; se existe sessão com ele, apaga; responde sempre `204` sem corpo (idempotente: token inválido ou já apagado também dá `204`).
4. Fechamento: `npx prettier --write src/mocks/handlers/auth.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/auth.ts` e `git commit -m "05-011: handlers de sessão, renovação e logout"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Sem token → `401 UNAUTHORIZED`; token vencido → `401 SESSION_EXPIRED`; token válido → `200` com o usuário **sem** campos de senha.
- [ ] Depois do refresh, o token antigo recebe `401 UNAUTHORIZED` e o novo funciona.
- [ ] Depois do logout, `GET /auth/session` com o mesmo token → `401`; logout repetido → `204`.
- [ ] Cenário `session-expired`: as três rotas respondem `401 SESSION_EXPIRED` mesmo com token válido.
- [ ] Os handlers antigos substituídos por `worker.use` nos testes das fases 03 e 04 continuam funcionando (o `use` tem prioridade).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` das fases 02 a 04 continua verde (o 05-041 ajusta o que as guardas quebrarem).
- Coberto no 05-012 e no 05-045.
