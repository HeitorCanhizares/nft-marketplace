# 05-006 — Mock: sessão, token e usuário público

**Status:** pendente
**Fluxo / subitem:** Login › 3, 5, 6 e 7 (sessão no mock)
**Depende de:** 02-007, 02-009, 02-010

## Objetivo
Criar os utilitários que todos os handlers do mock usam para ler o token, validar a sessão, criar uma sessão nova e expor o usuário sem o hash da senha.

## Arquivos
- criar: `src/mocks/handlers/sessionGuard.ts`

## Referências
- docs/api-mock/contratos.md (🔒: sem token `401 UNAUTHORIZED`; token vencido `401 SESSION_EXPIRED`; a sessão expira após `VITE_MOCK_SESSION_TTL_SECONDS`)
- docs/api-mock/persistencia.md (`sessions`: `token`, `expiresAt`, `userId`; senha nunca em claro)
- `src/mocks/db/db.ts` (`SessionRecord`, `UserRecord`), `src/mocks/db/stores.ts`, `src/mocks/scenarios/errors.ts` (`apiError`), `src/mocks/scenarios/config.ts` (`mockConfig.sessionTtlSeconds`)

## Instruções
1. `readBearerToken(request: Request): string | null`: lê `Authorization: Bearer <token>`.
2. `readCartId(request: Request): string | null`: lê `X-Cart-Id` (sem espaços; vazio → `null`).
3. `createSession(userId: string): Promise<SessionRecord>`: token `'tok-' + crypto.randomUUID()`, `expiresAt = new Date(Date.now() + mockConfig.sessionTtlSeconds * 1000).toISOString()`, grava em `sessionsStore` e devolve.
4. `type AuthenticatedRequest = { session: SessionRecord; user: UserRecord }` e `authenticate(request: Request): Promise<AuthenticatedRequest | Response>`:
   - sem token, token desconhecido ou usuário inexistente → `apiError('UNAUTHORIZED')`;
   - `Date.parse(session.expiresAt) <= Date.now()` → apaga a sessão e devolve `apiError('SESSION_EXPIRED')`;
   - senão devolve `{ session, user }`.
   Quem chama faz `if (auth instanceof Response) return auth`.
5. `toPublicUser(record: UserRecord): User`: devolve `id`, `displayName`, `username`, `email` e, **só se existirem**, `ensName`, `walletNickname`, `avatarUrl`. **Nunca** `passwordHash` nem `passwordSalt`.
6. O cenário `session-expired` **não** é tratado aqui: é do `withMock(..., { protected: true })`.
7. Fechamento: `npx prettier --write src/mocks/handlers/sessionGuard.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/sessionGuard.ts` e `git commit -m "05-006: sessão e usuário público do mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; importa só de `src/mocks`, `src/types`, `src/schemas` e `src/lib`.
- [ ] `toPublicUser` nunca devolve campos de senha (nem a chave com `undefined`).
- [ ] Token vencido apaga o registro da sessão.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Exercitado pelos handlers de sessão no 05-012.
