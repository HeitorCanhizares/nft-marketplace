# 09-001 — Schemas e serviço do perfil

**Status:** pendente
**Fluxo / subitem:** Perfil › 2 (dados), 3 (e-mail), 4 (avatar), 5 (senha)
**Depende de:** 08-015

## Objetivo
Os schemas zod (corpos da API e formulário) e as funções de chamada do perfil, compartilhados pelo mock e pelo front.

## Arquivos
- criar: `src/schemas/profile.ts`
- criar: `src/services/api/profile.ts`

## Referências
- Contrato: docs/api-mock/contratos.md#perfil
- Regras: docs/fluxos/perfil.md (subitens 2, 3, 4, 5); docs/fluxos/cadastro.md (regras de validação)
- Padrão: `src/schemas/auth.ts` (corpo da API + schema do formulário), `src/schemas/user.ts` (`userSchema`), `src/services/api/auth.ts`, `src/services/http/validate.ts` (`get`, `patch`, `put`, `post`, `del`), `src/services/http/client.ts`

## Instruções
1. **`src/schemas/profile.ts`** (reusar `usernameSchema`, `emailSchema`, `passwordSchema` de `@/schemas/common`; mensagens em português):
   - Constantes: `ENS_SUFFIX = '.eth'`, `AVATAR_MAX_BYTES = 2 * 1024 * 1024`, `AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const`.
   - `displayNameSchema`: `trim`, mínimo 1 ("Informe um nome de exibição."), máximo 40 ("O nome de exibição deve ter até 40 caracteres.").
   - `walletNicknameSchema`: `trim`, máximo 30 ("O apelido deve ter até 30 caracteres."); vazio é válido.
   - `ensLabelSchema`: `trim`; vazio é válido; senão `/^[a-z0-9-]{3,63}$/` ("Use de 3 a 63 letras minúsculas, números ou hífens.").
   - `profileBodySchema` (corpo do `PATCH /profile`): `displayName`, `username`, `email`, `ensName` (opcional; string vazia ou `<label>.eth` com o label válido), `walletNickname` (opcional), `currentPassword` (opcional, mínimo 1). Exportar `ProfileBody = z.output<...>`.
   - `changePasswordBodySchema` (corpo do `POST /profile/password`): `currentPassword` (mínimo 1, "Informe sua senha atual."), `newPassword` (`passwordSchema`); `.refine` nova diferente da atual, erro em `newPassword`: "A nova senha deve ser diferente da atual." Exportar `ChangePasswordBody`.
   - `avatarResponseSchema`: `{ avatarUrl: string }`.
   - `profileFormSchema` (formulário): `displayName`, `username`, `email`, `ensLabel`, `walletNickname`, `currentPassword`, `newPassword`, `confirmNewPassword` (todos `string`). `superRefine`: se **algum** dos três campos de senha estiver preenchido, os três passam a ser obrigatórios ("Informe sua senha atual.", `passwordSchema` na nova, "Confirme a nova senha."), a confirmação precisa ser igual à nova ("As senhas não coincidem.", erro em `confirmNewPassword`) e a nova diferente da atual (erro em `newPassword`). Com os três vazios, nada de senha é validado. Exportar `ProfileFormValues = z.input<...>`.
   - Helpers puros: `toProfileFormValues(user: User): ProfileFormValues` (`ensLabel` = `user.ensName` sem o sufixo `.eth` final, ou `''`; opcionais ausentes viram `''`; campos de senha `''`), `toEnsName(label: string): string` (`''` se vazio, senão `label.trim().toLowerCase() + ENS_SUFFIX`).
2. **`src/services/api/profile.ts`**:
   - `getProfile(signal?)` → `get('/profile', userSchema, { signal })`.
   - `updateProfile(body: ProfileBody)` → `patch('/profile', userSchema, body)`.
   - `uploadAvatar(file: File)` → `put('/profile/avatar', avatarResponseSchema, formData)` com `FormData` (campo `file`). Conferir em `client.ts` se há `Content-Type` padrão JSON; se houver, passar `headers: { 'Content-Type': 'multipart/form-data' }` para o axios montar o limite do corpo. **Parar e perguntar** se o interceptor impedir o envio.
   - `removeAvatar()` → `del('/profile/avatar', null)`.
   - `changePassword(body: ChangePasswordBody)` → `post('/profile/password', null, body)`.
3. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-001: schemas e serviço do perfil`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; mensagens em português; nenhuma regra de usuário/e-mail/senha duplicada (reuso de `common.ts`).
- [ ] `profileFormSchema` com senhas vazias é válido; com só um campo de senha preenchido, os outros dois acusam "obrigatório".

## Verificação (Sonnet)
- format:check, lint, typecheck, build.
