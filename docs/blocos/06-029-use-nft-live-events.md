# 06-029 — Hook `useNftLiveEvents` (aplicar os eventos no cache)

**Status:** pendente
**Fluxo / subitem:** Início › 11 (preço alterado muda o card; estoque zerado mostra "Esgotado")
**Depende de:** 06-024, 03-011
**Depende de decisão:** pergunta 12 do relatório da fase 06 (como os eventos entram no cache)

## Objetivo
Ouvir `nft:price_changed` e `nft:stock_changed` e refletir no cache das listas, sem reordenar a grade.

## Arquivos
- criar: `src/hooks/useNftLiveEvents.ts`

## Referências
- docs/api-mock/realtime.md ("Atualiza `nfts.list` com `setQueryData`"; "Mudanças em tempo real nunca movem o foco nem trocam o layout de lugar") e docs/fluxos/inicio.md (subitem 11)
- `src/services/realtime/socket.ts` (`onSocketEvent`), `src/services/realtime/events.ts` (payloads), `src/hooks/queryKeys.ts` (`nfts.lists`), `src/types/catalog.ts` (`CatalogResponse`)

## Instruções
1. `useNftLiveEvents()`: um `useEffect` que registra os dois ouvintes com `onSocketEvent` e devolve o desfazer de ambos.
2. **`nft:price_changed`:** para cada `[key, data]` de `queryClient.getQueriesData<CatalogResponse>({ queryKey: nfts.lists })` que contém um item com `id === nftId`:
   - se `item.defaultEditionId === editionId` (a edição do preço exibido): `setQueryData(key, …)` trocando **só** esse item por `{ ...item, price: payload.price, previousPrice: payload.previousPrice }` (a mesma posição, os mesmos outros itens);
   - senão (outra edição: o preço exibido pode ter mudado, e o front **não compara nem calcula valores**): `invalidateQueries({ queryKey: key })`.
3. **`nft:stock_changed`:** para cada lista que contém o NFT: `invalidateQueries({ queryKey: key })` (o servidor sabe se o NFT esgotou e qual é a nova edição do preço). A ordem da grade continua a anterior graças ao `keepOrder` do `useCatalog` (06-024).
4. Não mexer no foco nem no `announce` (o anúncio agrupado é do 06-030). Nenhum `sort` aqui.
5. Fechamento: `npx prettier --write src/hooks/useNftLiveEvents.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useNftLiveEvents.ts` e `git commit -m "06-029: hook useNftLiveEvents"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; evento de NFT que não está em nenhuma lista não faz nada.
- [ ] O preço do card muda **sem** nova requisição quando o evento é da edição exibida.
- [ ] Nenhum item muda de posição.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-065.
