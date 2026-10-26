# 06-025 — Hook `useToggleFavorite` (favoritar com atualização otimista)

**Status:** concluído
**Fluxo / subitem:** Início › 8 (favoritar: otimista; visitante vai ao login e conclui na volta) e 12 (erro em ação do card)
**Depende de:** 06-006, 06-024, 05-026, 03-015
**Depende de decisão:** pergunta 13 do relatório da fase 06 (favoritar dentro de `/?favoritos=1`)

## Objetivo
Favoritar e desfavoritar a partir do card, com atualização otimista, desfazendo e avisando em caso de erro, e levando o visitante ao login com a ação guardada.

## Arquivos
- criar: `src/hooks/useToggleFavorite.ts`

## Referências
- docs/fluxos/inicio.md (subitens 8, 9, 12) e docs/arquitetura/estado.md ("Atualização otimista: favoritos... Em caso de erro, desfaz e avisa")
- `src/lib/pendingAction.ts` (`savePendingAction`), `src/contexts/auth.ts` (`useAuth`), `src/hooks/queryKeys.ts` (`nfts.lists`, `home`, `favorites`), `src/services/api/favorites.ts`, `sonner` (o toast já é anunciado: **não** repetir em `announce`)

## Instruções
1. `useToggleFavorite()` devolve `{ toggle(nft: NftSummary): void; pendingIds: ReadonlySet<string> }`.
2. **Visitante** (`status === 'anonymous'`): `savePendingAction({ type: 'favorite', nftId: nft.id })` e `navigate({ to: '/entrar', search: { redirect: router.state.location.href } })` (a Início fica de volta ao terminar o login). **`status === 'loading'`:** não faz nada.
3. **Logado:** `useMutation` com `next = !(nft.isFavorite === true)`:
   - `onMutate`: cancelar `nfts.lists` e `home`; guardar o estado atual de **todas** as queries `nfts.lists` e de `home` (`getQueriesData`); gravar `isFavorite: next` em todo item com esse id (listas e `hero`/`featured` do `home`) com `setQueriesData`; incluir o id em `pendingIds`;
   - `mutationFn`: `next ? addFavorite(id) : removeFavorite(id)`;
   - `onError`: restaurar os dados guardados e `toast.error('Não foi possível ' + (next ? 'favoritar' : 'remover dos favoritos') + ' ' + nft.name + '. Tente de novo.')`;
   - `onSuccess`: `toast.success(next ? nft.name + ' adicionado aos favoritos' : nft.name + ' removido dos favoritos')`;
   - `onSettled`: tirar o id de `pendingIds` e `invalidateQueries({ queryKey: favorites })`. **Não** invalidar as listas (a ordem não pode mudar e, em `/?favoritos=1`, o card fica até o usuário recarregar ou mudar a busca).
4. Clique repetido no mesmo NFT enquanto está em `pendingIds` é ignorado.
5. Fechamento: `npx prettier --write src/hooks/useToggleFavorite.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useToggleFavorite.ts` e `git commit -m "06-025: hook useToggleFavorite"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; o coração muda **antes** da resposta e volta se der erro (com toast).
- [ ] Visitante: nada é enviado à API; vai para `/entrar?redirect=<URL atual>` e `kurio:pending-action` guarda `{ type: 'favorite', nftId }`.
- [ ] A lista não é reordenada nem refeita ao favoritar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-063.
