# 09-003 — Handlers do mock: avatar

**Status:** pendente
**Fluxo / subitem:** Perfil › 4 (avatar)
**Depende de:** 09-002

## Objetivo
`PUT` e `DELETE /profile/avatar` e `GET /avatars/:userId`, com o blob no IndexedDB.

## Arquivos
- criar: `src/mocks/handlers/avatar.ts`
- alterar: `src/mocks/browser.ts` (registrar `avatarHandlers`)

## Referências
- Contrato: docs/api-mock/contratos.md#perfil; docs/api-mock/persistencia.md (`avatars` por `userId`, servido por `GET /api/avatars/:userId`)
- Padrão: `src/mocks/handlers/profile.ts` (09-002), `avatarsStore` em `src/mocks/db/stores.ts`, `apiPath` em `src/mocks/scenarios/config.ts`
- Constantes: `AVATAR_MAX_BYTES`, `AVATAR_MIME_TYPES`, `avatarResponseSchema` de 09-001

## Instruções
1. `avatar.ts`, exportar `avatarHandlers`:
   - **`PUT /profile/avatar`** (`protected: true`, `authenticate`): `await request.formData()` (falha → `BAD_REQUEST`); o campo `file` precisa ser `File`. Tipo fora de `AVATAR_MIME_TYPES` ou tamanho acima de `AVATAR_MAX_BYTES` → `422 VALIDATION_ERROR` com `fields.file` ("Use uma imagem PNG, JPG ou WEBP." / "A imagem deve ter até 2 MB."). Sucesso: `avatarsStore.put({ userId, blob: file })`; `avatarUrl = apiPath('/avatars/' + userId) + '?v=' + Date.now()` (o `v` troca o cache do navegador a cada envio); `usersStore.put({ ...user, avatarUrl })`; responde `{ avatarUrl }`.
   - **`DELETE /profile/avatar`** (`protected: true`): `avatarsStore.delete`; remove a chave `avatarUrl` do usuário; `204` (idempotente).
   - **`GET /avatars/:userId`** (**pública**, `exemptFromRandomFailures: true`, sem `protected`): lê o blob; ausente → `apiError('NOT_FOUND')`; presente → `new HttpResponse(blob, { headers: { 'Content-Type': blob.type, 'Cache-Control': 'no-store' } })`.
2. Conferir que `avatarUrl` serve como `src` de `<img>` na origem do app (relativo ao host, como o restante da API). Se `apiPath` devolver outra forma, **parar e perguntar**.
3. `browser.ts`: incluir `...avatarHandlers` em `resourceHandlers`.
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-003: handlers de avatar`.

## Critérios de aceite
- [ ] A rota do avatar não exige token (a `<img>` não envia `Authorization`).
- [ ] Arquivo inválido no mock devolve `422` com `fields.file`; o blob antigo não é substituído.
- [ ] Sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 09-014.
