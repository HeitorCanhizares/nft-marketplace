# 06-028 — Hook `useNftSubscriptions` (inscrever os NFTs visíveis)

**Status:** concluído
**Fluxo / subitem:** Início › 11 (tempo real: inscreve os visíveis, cancela ao sair ou trocar de página; revalida ao reconectar)
**Depende de:** 06-024, 03-011

## Objetivo
Inscrever no socket os NFTs que estão na grade, trocar a inscrição quando a lista muda, cancelar ao desmontar e revalidar as listas depois de uma reconexão.

## Arquivos
- criar: `src/hooks/useNftSubscriptions.ts`

## Referências
- docs/api-mock/realtime.md (`nft:subscribe`/`nft:unsubscribe`; "Ao reconectar, o front invalida as queries afetadas (pode ter perdido eventos)"; armadilhas do `ws.link('*')`, ping e reconexão ficam no mock)
- `src/services/realtime/socket.ts` (`subscribeNfts`, `unsubscribeNfts`, `onReconnect`; o `connect` do socket reenvia o que está guardado), `src/hooks/queryKeys.ts`

## Instruções
1. `useNftSubscriptions(ids: readonly string[])`: guarda numa `ref` os ids que **este hook** inscreveu. Quando `ids` muda (comparar pelo conteúdo ordenado, não pela referência): `subscribeNfts(novos)` para os que entraram e `unsubscribeNfts(removidos)` para os que saíram. Ao desmontar: `unsubscribeNfts` de tudo que a `ref` guarda.
2. Em outro `useEffect`: `onReconnect(() => { invalidateQueries({ queryKey: nfts.lists }); invalidateQueries({ queryKey: home }) })` e devolve o desfazer.
3. Lista vazia (carregando) não inscreve nada. Não importar nada de `mocks/`.
4. Fechamento: `npx prettier --write src/hooks/useNftSubscriptions.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useNftSubscriptions.ts` e `git commit -m "06-028: hook useNftSubscriptions"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; trocar de página inscreve os 9 novos e cancela os 9 antigos (o mock confirma pelas inscrições).
- [ ] Sair da Início cancela tudo; `StrictMode` (montagem dupla) não deixa inscrição sobrando.
- [ ] Derrubar o socket (`dropConnections`) e reconectar refaz as listas ativas.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-065.
