# 09-006 — `useProfileSave`: os dois envios independentes

**Status:** concluído
**Fluxo / subitem:** Perfil › 3 (e-mail), 5 (senha), 6 (salvar)
**Depende de:** 09-005

## Objetivo
Um hook que, a partir dos valores do formulário, envia dados e senha **de forma independente** e devolve o resultado de cada bloco, já com os erros da API mapeados.

## Arquivos
- criar: `src/hooks/useProfileSave.ts`

## Referências
- docs/fluxos/perfil.md (subitens 3, 5, 6); contrato de erros em docs/api-mock/contratos.md
- `useUpdateProfile`, `useChangePassword` (09-005), `toEnsName` e `ProfileFormValues` (09-001), `isApiError` (`src/services/http/ApiError.ts`), `useLiveAnnouncer`, `toast`

## Instruções
1. Tipos exportados (usar exatamente estes):
   ```ts
   export type SaveBlockError = {
     code: string | null
     message: string
     fields: Record<string, string>
   }
   export type SaveBlockResult = 'skipped' | 'ok' | SaveBlockError
   export type ProfileSaveResult = { profile: SaveBlockResult; password: SaveBlockResult }
   export type ProfileSaveInput = {
     values: ProfileFormValues
     changed: { data: boolean; password: boolean }
     emailPassword?: string // senha digitada no diálogo; só quando o e-mail mudou
   }
   ```
2. `useProfileSave()` devolve `{ save(input): Promise<ProfileSaveResult>, isSaving: boolean }` (`isSaving` vem das mutations, `isPending` de uma ou outra).
3. `save`: monta o corpo de dados (`displayName`, `username`, `email`, `ensName: toEnsName(values.ensLabel)`, `walletNickname`, `currentPassword: emailPassword` só se informado) e o de senha (`currentPassword`, `newPassword`). Dispara **só os blocos com `changed` verdadeiro**, em paralelo com `Promise.allSettled`; um erro não cancela nem desfaz o outro.
4. Erros: `isApiError(error)` vira `SaveBlockError { code: error.code, message: error.message, fields: error.fields ?? {} }` (conferir o nome do campo em `ApiError`). Erro que não é de API ou de rede: `code: null`, mensagem "Não foi possível salvar. Verifique sua conexão e tente novamente." Erro `5xx`: a mesma mensagem.
5. Anúncios (somente sucesso): dados ok → `toast.success('Perfil atualizado')` + `announce('Perfil atualizado', 'polite')`; senha ok → `toast.success('Senha alterada')` + `announce('Senha alterada', 'polite')`. Se os dois derem certo, os dois anúncios (um por bloco). Erro de bloco: `announce(<mensagem>, 'assertive')`.
6. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-006: hook de salvar do perfil`.

## Critérios de aceite
- [ ] Senha errada na troca de senha não impede os dados de serem salvos, e vice-versa.
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `ref` no render; clique repetido envia uma vez (a trava vem do 09-005).

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 09-014.
