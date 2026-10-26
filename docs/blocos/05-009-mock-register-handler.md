# 05-009 — Mock: `POST /auth/register`

**Status:** pendente
**Fluxo / subitem:** Cadastro › 4 e 5 (conflito no envio, login automático, mescla do carrinho)
**Depende de:** 02-011, 05-001, 05-005, 05-006, 05-008

## Objetivo
Implementar o cadastro no mock: valida, detecta conflito (de verdade e por cenário), guarda a senha só como hash PBKDF2, cria a sessão, mescla o carrinho do visitante e responde `201`.

## Arquivos
- alterar: `src/mocks/handlers/auth.ts`

## Referências
- docs/api-mock/contratos.md (`POST /auth/register`: corpo `{ username, email, password }`; `201 { user, session }`; `409 EMAIL_TAKEN` / `USERNAME_TAKEN` com `fields`; `422 VALIDATION_ERROR`; `details.adjustments` do carrinho) e docs/api-mock/cenarios.md (cenários `email-taken` e `username-taken`)
- docs/api-mock/persistencia.md (`users`: hash PBKDF2-SHA-256 com salt por usuário; **nunca** senha em claro)
- `src/mocks/db/password.ts` (`hashPassword`), `src/mocks/db/cartMerge.ts`, `src/mocks/handlers/sessionGuard.ts`, `src/mocks/scenarios/active.ts` (`hasScenario`)

## Instruções
1. Handler `http.post(apiPath('/auth/register'), withMock('POST /auth/register', …))`, nesta ordem:
   1. corpo inválido (não objeto) → `BAD_REQUEST`; `registerBodySchema.safeParse` falha → `validationError`;
   2. cenário `email-taken` → `409 EMAIL_TAKEN` com `fields: { email: 'Este e-mail já está cadastrado.' }`; cenário `username-taken` → `409 USERNAME_TAKEN` com `fields: { username: 'Este nome de usuário já está em uso.' }`;
   3. conflito real (comparação em **minúsculas** com `usersStore.getAll()`): e-mail em uso → `EMAIL_TAKEN` com as mesmas `fields`; usuário em uso → `USERNAME_TAKEN`; **os dois** → código `EMAIL_TAKEN` com as duas chaves em `fields`;
   4. cria o usuário: `id = 'user-' + crypto.randomUUID()`, `username` como digitado, `email` em minúsculas (o índice único do banco é sensível a maiúsculas), `displayName = username`, `passwordSalt`/`passwordHash` de `hashPassword(password)`; `usersStore.put`;
   5. `createSession(user.id)`; `mergeGuestCart(user.id, readCartId(request))`;
   6. `201 { user: toPublicUser(user), session: { token, expiresAt }, details?: { adjustments } }` — `details` só quando `adjustments.length > 0`.
2. A resposta **nunca** contém hash, salt nem a senha; nada de senha em `console.log`.
3. Fechamento: `npx prettier --write src/mocks/handlers/auth.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/auth.ts` e `git commit -m "05-009: handler de cadastro"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; camadas respeitadas.
- [ ] Cadastro válido → `201`, usuário no IndexedDB com `passwordHash` e **sem** a senha em texto.
- [ ] E-mail do seed em maiúsculas (`TESTE@kurio.test`) → `409` com `fields.email`; usuário `Teste` → `409` com `fields.username`.
- [ ] Cenários `email-taken` e `username-taken` forçam o `409` mesmo com dados livres.
- [ ] Com `X-Cart-Id` de um carrinho com excesso de estoque, a resposta traz `details.adjustments`.
- [ ] Dois cadastros iguais em sequência: o segundo falha com `409`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-012.
