# 09-012 — `ProfileForm`: validação, "Salvar" e fluxo do e-mail

**Status:** concluído
**Fluxo / subitem:** Perfil › 2, 3, 5, 6, 7, 9
**Depende de:** 09-006, 09-009, 09-011

## Objetivo
O formulário completo: um `useForm`, o botão "Salvar" com dois envios independentes, o diálogo de senha na troca de e-mail e o aviso de alterações não salvas.

## Arquivos
- criar: `src/pages/Profile/ProfileForm.tsx`

## Referências
- Tela: `docs/design/telas/desktop-perfil.png` (1:1); docs/fluxos/perfil.md (subitens 2, 3, 5, 6, 7, 9)
- `ProfileDataSection`, `PasswordSection` (09-011), `AvatarUploader` (09-008), `ConfirmPasswordDialog` (09-007), `UnsavedChangesGuard` (09-009), `useProfileSave` (09-006), `useAvailability`, `useDeferredEmptyValidation`, `profileFormSchema`/`toProfileFormValues` (09-001)
- Padrão de formulário: `src/components/shared/SignupForm.tsx`

## Medidas do Figma — botão "Salvar" (desktop)
- **131 × 40 px**, `primary`, texto 14 px bold; **32 px** abaixo do campo "Confirmar nova senha"; alinhado à esquerda da coluna. Mobile: largura total, **60 px** de altura, `rounded-4xl` (`AUTH_SUBMIT_CLASS`), 32 px acima.

## Instruções
1. Props: `{ user: User }`. O `useForm` usa `toProfileFormValues(user)` como `defaultValues` **uma só vez** (mudanças posteriores de `user`, como o avatar, não reiniciam o formulário); `resolver` = `useDeferredEmptyValidation(zodResolver(profileFormSchema))`; `mode: 'onTouched'`. `<form noValidate>` com `onSubmit` que chama `markSubmitAttempt()` e `handleSubmit`.
2. Estado local: `confirmOpen`, `emailPassword` (não fica no `useForm`), `serverErrors` (`{ displayName?, username?, email?, ensLabel?, walletNickname?, currentPassword?, newPassword? }`), `dataMessage`, `passwordMessage` (`string | null`), `dialogError`. Erros do servidor ficam **fora do react-hook-form** (ele os apagaria ao sair do campo) e são limpos ao editar o campo correspondente.
3. **Alterações:** `changed.data` = algum de `displayName`, `username`, `email`, `ensLabel`, `walletNickname` diferente do padrão (`formState.dirtyFields`); `changed.password` = algum campo de senha preenchido. `isDirty = changed.data || changed.password`. "Salvar" fica **desabilitado sem alterações** e enquanto `isSaving`.
4. **Envio válido:** se o e-mail mudou (comparando sem diferenciar maiúsculas com `user.email`) e ainda não há `emailPassword` → abre `ConfirmPasswordDialog`; `onConfirm(password)` guarda `emailPassword` e executa o salvar. Senão, salva direto. O salvar chama `useProfileSave().save({ values, changed, emailPassword })` e trata o `ProfileSaveResult` **por bloco**:
   - `profile` **ok** → `resetField` dos campos de dados com o novo valor como padrão (ENS e apelido refletem o que foi enviado), fecha o diálogo, limpa `emailPassword`.
   - `profile` com `code === 'INVALID_CURRENT_PASSWORD'` → o diálogo **continua aberto** com `dialogError = fields.currentPassword ?? message`; o restante do formulário é mantido.
   - `profile` com `EMAIL_TAKEN` / `USERNAME_TAKEN` / `VALIDATION_ERROR` → fecha o diálogo, `serverErrors` pelos `fields` (`ensName` → `ensLabel`), foco no primeiro campo com erro.
   - `profile` com outro erro (rede/5xx) → fecha o diálogo e `dataMessage = message`.
   - `password` **ok** → limpa os três campos de senha (valor e padrão) e `serverErrors` de senha.
   - `password` com `INVALID_CURRENT_PASSWORD` → `serverErrors.currentPassword` e foco em "Senha atual"; `VALIDATION_ERROR` → `serverErrors.newPassword`; outro → `passwordMessage`.
   - Um bloco com erro **não** desfaz o outro; o formulário nunca é limpo por erro.
5. **Trava:** o handler de envio retorna cedo se `isSaving` ou se `queryClient.isMutating` indicar envio em curso (a trava síncrona vem do 09-005/09-006).
6. **Botão:** `type="submit"`, texto "Salvar"; carregando: `Loader2Icon` girando (movimento reduzido: sem giro), `aria-busy="true"`.
7. **Guard:** `<UnsavedChangesGuard when={isDirty && !isSaving} />`.
8. **Avatar:** passar `<AvatarUploader avatarUrl={user.avatarUrl} name={user.displayName} />` como `avatarSlot` (fora do `<form>` lógico: seus botões são `type="button"`).
9. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-012: formulário do perfil`.

## Critérios de aceite
- [ ] Só dados alterados: um `PATCH`; só senha: um `POST`; ambos: duas requisições independentes.
- [ ] Trocar o e-mail abre o diálogo; senha errada mantém o diálogo com o erro e os campos intactos.
- [ ] Campo vazio obrigatório só acusa ao enviar (`useDeferredEmptyValidation`); erros de formato ao sair do campo.
- [ ] Sair com alterações abre "Descartar alterações?"; depois de salvar, não bloqueia.
- [ ] Acessibilidade: foco no primeiro erro; erros anunciados; botão com estado de carregamento; sem overflow em 320 px.
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `ref` lido no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Fluxo exercitado pelo spec do 09-014.
