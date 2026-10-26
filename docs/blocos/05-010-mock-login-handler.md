# 05-010 — Mock: `POST /auth/login`

**Status:** concluído
**Fluxo / subitem:** Login › 3 e 4 (credenciais, bloqueio, mescla do carrinho)
**Depende de:** 05-001, 05-005, 05-006, 05-007, 05-009

## Objetivo
Implementar o login no mock: valida, confere a senha pelo hash, conta tentativas erradas e bloqueia por 30 s, cria a sessão e mescla o carrinho do visitante.

## Arquivos
- alterar: `src/mocks/handlers/auth.ts`

## Referências
- docs/api-mock/contratos.md (`POST /auth/login`: `200 { user, session }`; `401 INVALID_CREDENTIALS`; `422`; após 5 erros `429 TOO_MANY_ATTEMPTS` com `details.retryAfterSeconds`)
- docs/fluxos/login.md (subitem 3: mensagem sem dizer qual campo está errado)
- `src/mocks/db/password.ts` (`verifyPassword`), `src/mocks/db/loginAttempts.ts`, `src/mocks/handlers/sessionGuard.ts`, `src/mocks/db/cartMerge.ts`, `src/mocks/scenarios/errors.ts`

## Instruções
1. Handler `http.post(apiPath('/auth/login'), withMock('POST /auth/login', …))`, nesta ordem:
   1. corpo inválido → `BAD_REQUEST`; `loginBodySchema.safeParse` falha → `validationError`;
   2. `getLockRemainingSeconds(email)` > 0 → `apiError('TOO_MANY_ATTEMPTS', { details: { retryAfterSeconds }, message: 'Muitas tentativas. Tente novamente em N segundos.' })` (N = o valor, com "segundo" no singular quando for 1);
   3. `usersStore.getByEmail(email em minúsculas)`; usuário inexistente **ou** `verifyPassword` falso → `registerFailedAttempt(email)`; se devolveu > 0 (a 5ª falha), responde o `429` do item 2 com esse valor; senão `apiError('INVALID_CREDENTIALS')` (mensagem padrão "E-mail ou senha incorretos.", sem `fields`);
   4. sucesso: `resetAttempts(email)`, `createSession`, `mergeGuestCart(user.id, readCartId(request))`;
   5. `200 { user: toPublicUser(user), session: { token, expiresAt }, details?: { adjustments } }` (`details` só com ajustes).
2. Nenhum cenário forçado altera o login além dos genéricos do middleware (latência, `offline`, `server-error:POST /auth/login`, `validation-error:POST /auth/login`). **Não** marcar a rota como `protected` (o login funciona com o cenário `session-expired`).
3. Fechamento: `npx prettier --write src/mocks/handlers/auth.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/auth.ts` e `git commit -m "05-010: handler de login"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Credenciais do seed (`tests/e2e/fixtures.ts`) → `200`; e-mail em maiúsculas também funciona.
- [ ] Senha errada e e-mail inexistente devolvem a **mesma** resposta `401 INVALID_CREDENTIALS`.
- [ ] 5 falhas seguidas: as 4 primeiras `401`, a 5ª `429` com `retryAfterSeconds: 30`; nova tentativa com a senha **certa** durante o bloqueio também recebe `429`; depois de 30 s volta a funcionar.
- [ ] Login certo zera o contador.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-012 (com `page.clock` para os 30 s).
