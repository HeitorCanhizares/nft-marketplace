# 10-005 — Hook do formulário de uma carteira (`useWalletSlotForm`)

**Status:** concluído
**Fluxo / subitem:** Carteiras › 2, 3, 6, 7
**Depende de:** 10-001, 10-003

## Objetivo
Um hook por carteira (principal e secundária) que reúne `useForm`, valores iniciais (carteira ou perfil), "alterações", envio, erros da API e a mensagem do topo do bloco.

## Arquivos
- criar: `src/pages/Wallets/useWalletSlotForm.ts`

## Referências
- Padrão: `src/pages/Profile/ProfileForm.tsx` e `src/hooks/useProfileSave.ts` (`toBlockError`, `serverErrors` fora do react-hook-form, `useDeferredEmptyValidation`, `markSubmitAttempt`)
- `walletsFormSchema`, `toWalletFormValues`, `toWalletBody`, `copyWalletValues` (10-001); `useWalletMutations` (10-003); `useAuth` (`user`), `isApiError` (`src/services/http/ApiError`)
- Decisão: pré-preenchimento usa `useAuth().user` (já carregado; sem segunda requisição de perfil)

## Instruções
1. Assinatura: `useWalletSlotForm(slot: 'primary' | 'secondary', wallet: Wallet | null, options?: { onSaved?: () => void })`. Devolve: `{ form, serverErrors, message, isDirty, isSaving, submit, applyValues, resetToWallet, focusFirst }`.
2. `useForm<WalletFormValues>` com `defaultValues = toWalletFormValues(wallet, user)`, `resolver = useDeferredEmptyValidation(zodResolver(walletsFormSchema))`, `mode: 'onTouched'`. **Reinicia só quando a carteira mudar de verdade** (`wallet?.id` ou o `slot` do registro: salvar, remover, trocar): `useEffect` com `form.reset(toWalletFormValues(wallet, user))` dependendo de `wallet` (comparar por conteúdo, não por referência, para um refetch igual não apagar a edição). Mudança em `user` **não** reinicia.
3. `isDirty` = `form.formState.isDirty`. "Sem principal": os valores do perfil são o padrão, então só há alteração se o usuário mudar algo.
4. `username` já está nos valores do formulário (`toWalletFormValues`: carteira ou perfil); não aparece em Carteiras e não entra em `EDITABLE_KEYS`.
5. `submit`: `form.handleSubmit` depois de `markSubmitAttempt()`; retorna cedo se `isSaving`. Chama `savePrimary`/`saveSecondary` (10-003) com `toWalletBody(values)`. Sucesso → `form.reset(valores enviados)` (vira o novo padrão), limpa `serverErrors` e `message`, chama `options.onSaved?.()`.
6. **Erros:** `isApiError` com `VALIDATION_ERROR` e `fields` → `serverErrors` (chaves da API; `ensName` vira `ensLabel`), foco no primeiro campo com erro (`form.setFocus`), **formulário preservado**; rede/timeout/5xx/desconhecido → `message = 'Não foi possível salvar. Verifique sua conexão e tente novamente.'`, sem tocar nos campos. `serverErrors[campo]` e `message` são limpos quando o campo correspondente é editado (`form.watch` por subscription em `useEffect`, não leitura de ref no render).
7. `applyValues(values)` → `form.reset(values, { keepDefaultValues: true })` + `setValue` marcando `shouldDirty` (usado pelo "Igual à carteira principal"); `resetToWallet()` → volta ao padrão; `focusFirst()` → `form.setFocus('displayName')`.
8. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `10-005: hook do formulário de carteira`.

## Critérios de aceite
- [ ] Valores iniciais: carteira existente, ou perfil (nome de exibição, e-mail, ENS, apelido) quando não há.
- [ ] `isDirty` fica falso depois de salvar; erro `422` mostra os erros nos campos e mantém tudo o que foi digitado.
- [ ] Campo obrigatório vazio só acusa ao enviar (`useDeferredEmptyValidation`); erro de formato ao sair do campo.
- [ ] Sem `ref` lido no render; sem `any`, sem `@ts-ignore`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 10-010.
