# 09-005 — Hooks do perfil, avatar e senha

**Status:** concluído
**Fluxo / subitem:** Perfil › 2, 4, 5, 6
**Depende de:** 09-001, 09-003, 09-004

## Objetivo
`useProfile` (consulta e atualização), `useChangePassword` e `useUploadAvatar` / `useRemoveAvatar`, com trava de clique repetido.

## Arquivos
- criar: `src/hooks/useProfile.ts`
- criar: `src/hooks/useChangePassword.ts`
- criar: `src/hooks/useProfileAvatar.ts`

## Referências
- Padrão de mutation com trava síncrona: `src/hooks/useToggleFavorite.ts`, `src/hooks/useCartCoupon.ts` (docs/arquitetura/estado.md: `queryClient.isMutating({ mutationKey })`, sem state/ref no render)
- `src/hooks/queryKeys.ts` (`profile`), `src/services/api/profile.ts` (09-001), `useAuth().updateUser` (09-004), `useLiveAnnouncer`, `toast` de `sonner`

## Instruções
1. **`useProfile.ts`**
   - `useProfile()`: `useQuery({ queryKey: profile, queryFn: ({ signal }) => getProfile(signal) })`.
   - `useUpdateProfile()`: `mutationKey: ['update-profile']`, `mutationFn: updateProfile`; `onSuccess(user)`: `queryClient.setQueryData(profile, user)` e `updateUser(user)` do `useAuth`. Expor `mutateAsync` **protegido**: se `queryClient.isMutating({ mutationKey: ['update-profile'] }) > 0`, devolve a promessa em andamento (ou rejeita sem enviar de novo), como nos hooks de referência. Sem toast (quem anuncia é o 09-006).
2. **`useChangePassword.ts`**: `useChangePassword()` com `mutationKey: ['change-password']`, `mutationFn: changePassword`, mesma trava. Sem toast.
3. **`useProfileAvatar.ts`**
   - `useUploadAvatar()` (`mutationKey: ['upload-avatar']`): `onSuccess({ avatarUrl })` atualiza o cache `profile` e `updateUser({ ...user, avatarUrl })` (ler o usuário do cache; se ausente, `invalidateQueries`); `toast.success('Foto de perfil atualizada')` e `announce('Foto de perfil atualizada', 'polite')`.
   - `useRemoveAvatar()` (`mutationKey: ['remove-avatar']`): `onSuccess` remove `avatarUrl` do usuário no cache e no `updateUser`; `toast.success('Foto removida')` e `announce('Foto removida', 'polite')`.
   - Erros **não** viram toast aqui: o `AvatarUploader` (09-008) mostra a mensagem e anuncia.
4. Fechamento: prettier nos 3; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-005: hooks do perfil`.

## Critérios de aceite
- [ ] Duplo clique síncrono em qualquer mutation envia **uma** requisição.
- [ ] Depois do upload e da remoção, `UserMenu` (via `updateUser`) e cache `profile` concordam.
- [ ] Sem `any`, sem `@ts-ignore`; nenhum `ref` no render.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 09-014.
