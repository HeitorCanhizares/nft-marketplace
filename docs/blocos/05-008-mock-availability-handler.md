# 05-008 — Mock: `POST /auth/availability` (e o arquivo de handlers de auth)

**Status:** pendente
**Fluxo / subitem:** Cadastro › 3 (disponibilidade ao sair do campo)
**Depende de:** 02-008, 02-009, 05-001
**Depende de decisão:** nenhuma

## Objetivo
Criar o arquivo `handlers/auth.ts`, registrá-lo no worker e implementar `POST /auth/availability` (e-mail e usuário, sem diferenciar maiúsculas). Também cria o helper `validationError` (422 com `fields`), que os outros handlers de auth reutilizam.

## Arquivos
- criar: `src/mocks/handlers/auth.ts`
- alterar: `src/mocks/browser.ts` (registrar `authHandlers`), `src/mocks/scenarios/errors.ts` (helper `validationError`)

## Referências
- docs/api-mock/contratos.md (`POST /auth/availability`: corpo `{ email }` ou `{ username }`, `200 { available }`, `422` para formato inválido) e docs/api-mock/cenarios.md (regras que o mock aplica sempre: validação dos corpos com os mesmos schemas zod, `422` com `fields`; e-mail e usuário únicos sem diferenciar maiúsculas)
- docs/fluxos/cadastro.md (subitem 3)
- `src/mocks/handlers/health.ts` (padrão do handler com `withMock`), `src/schemas/auth.ts` (05-001), `src/mocks/db/stores.ts` (`usersStore`)

## Instruções
1. `errors.ts`: `validationError(error: z.ZodError): Response` → `apiError('VALIDATION_ERROR', { fields })`, onde `fields` tem **uma mensagem por campo**: a da primeira issue de cada `path[0]` (chave `String(path[0])`; issue sem path vira a chave `form`). Sem `any`.
2. `auth.ts`: `export const authHandlers = [ … ]` com `http.post(apiPath('/auth/availability'), withMock('POST /auth/availability', …))`.
   - Lê o corpo com `request.json().catch(() => null)`. Corpo que não é objeto → `apiError('BAD_REQUEST')`.
   - `availabilityBodySchema.safeParse(body)`; falha → `validationError(result.error)`.
   - Compara em **minúsculas** com `usersStore.getAll()` (e-mail com `trim`); `200 { available: boolean }`.
   - Os cenários `email-taken` e `username-taken` **não** alteram este endpoint (eles forçam só o conflito no envio do cadastro; assim o teste do 409 passa pela tela).
3. `browser.ts`: `resourceHandlers = [...healthHandlers, ...authHandlers]`.
4. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/auth.ts src/mocks/browser.ts src/mocks/scenarios/errors.ts` e `git commit -m "05-008: handler de disponibilidade"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `mocks` não importa nada do app além de `types`, `schemas` e `lib`.
- [ ] `{ email: 'TESTE@kurio.test' }` → `{ available: false }`; `{ username: 'TESTE' }` → `false`; e-mail e usuário livres → `true`.
- [ ] Corpo `{ email: 'x' }` → `422` com `fields.email`; corpo `{}` → `422`.
- [ ] A rota passa por latência, falhas e cenários forçados do middleware (`server-error:POST /auth/availability` funciona).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-012 (`fetch('/api/auth/availability')` em `page.evaluate`).
