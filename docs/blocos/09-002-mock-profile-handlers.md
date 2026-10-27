# 09-002 — Handlers do mock: perfil e senha

**Status:** concluído
**Fluxo / subitem:** Perfil › 2, 3, 5, 6
**Depende de:** 09-001

## Objetivo
`GET /profile`, `PATCH /profile` e `POST /profile/password` no MSW, gravando no IndexedDB.

## Arquivos
- criar: `src/mocks/handlers/profile.ts`
- alterar: `src/mocks/db/stores.ts` (acrescentar `sessionsStore.getAll`)
- alterar: `src/mocks/browser.ts` (registrar `profileHandlers`)

## Referências
- Contrato: docs/api-mock/contratos.md#perfil; docs/api-mock/cenarios.md (regras que valem sempre: e-mail e usuário únicos)
- Padrão: `src/mocks/handlers/auth.ts` (`withMock`, `apiError`, `validationError`, `toPublicUser`, `authenticate`, `hashPassword`/`verifyPassword`), `src/mocks/handlers/sessionGuard.ts`
- Schemas: `profileBodySchema` e `changePasswordBodySchema` de 09-001

## Instruções
1. `stores.ts`: em `sessionsStore` incluir `getAll: async () => (await getDb()).getAll('sessions')`.
2. `profile.ts`, exportar `profileHandlers`. Todas as rotas com `withMock('<MÉTODO> /profile…', …, { protected: true })` e `authenticate(request)` (`if (auth instanceof Response) return auth`):
   - **`GET /profile`** → `HttpResponse.json(toPublicUser(auth.user))`.
   - **`PATCH /profile`**: corpo inválido (não objeto) → `BAD_REQUEST`; `profileBodySchema.safeParse` → `validationError`. Depois, nesta ordem:
     1. E-mail alterado (comparando sem diferenciar maiúsculas com o do usuário): sem `currentPassword` → `422 VALIDATION_ERROR` com `fields.currentPassword` "Informe sua senha atual."; senha errada (`verifyPassword`) → `apiError('INVALID_CURRENT_PASSWORD', { fields: { currentPassword: 'Senha atual incorreta.' } })`.
     2. Unicidade **ignorando o próprio usuário**, sem diferenciar maiúsculas, com as mesmas mensagens do `register` ('Este e-mail já está cadastrado.', 'Este nome de usuário já está em uso.'): ambos em conflito → `EMAIL_TAKEN` com os dois `fields`; só um → `EMAIL_TAKEN` ou `USERNAME_TAKEN` com o campo.
     3. Grava com `usersStore.put`: `displayName`, `username`, `email` em minúsculas, `ensName` e `walletNickname` (**vazio ou ausente limpa o campo**: não guardar a chave), preservando `avatarUrl` e o hash da senha. Responde `toPublicUser` (200).
   - **`POST /profile/password`**: `changePasswordBodySchema` → `validationError`; `verifyPassword` da atual (`{ salt: user.passwordSalt, hash: user.passwordHash }`) → senão `INVALID_CURRENT_PASSWORD` com `fields.currentPassword`. Gera `hashPassword(newPassword)`, grava e **apaga as outras sessões do mesmo usuário**: `sessionsStore.getAll()`, filtrar `userId === auth.user.id && token !== auth.session.token`, `sessionsStore.delete` em cada. Responde `204`.
3. `browser.ts`: importar e incluir `...profileHandlers` em `resourceHandlers`.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-002: handlers de perfil e senha`.

## Critérios de aceite
- [ ] Nunca devolve `passwordHash` nem `passwordSalt`.
- [ ] Alterar só o nome de exibição não exige senha; alterar o e-mail exige.
- [ ] A sessão atual continua valendo depois de trocar a senha; outras sessões do usuário somem.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 09-014.
