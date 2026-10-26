# 07-006 — Tempo real no detalhe

**Status:** pendente
**Fluxo / subitem:** Detalhes › 11 (tempo real)
**Depende de:** 07-004

## Objetivo
Inscrever o NFT aberto e aplicar `nft:price_changed` e `nft:stock_changed` no cache do detalhe.

## Arquivos
- criar: `src/hooks/useNftDetailLive.ts`

## Referências
- docs/api-mock/realtime.md (eventos e efeitos); docs/fluxos/detalhes-nft.md (subitem 11)
- `src/hooks/useNftSubscriptions.ts`, `src/hooks/useNftLiveEvents.ts` (como o socket é ouvido), `src/services/realtime/socket.ts` (`onSocketEvent`, `onReconnect`), `src/lib/formatEth.ts` (`formatEthSpoken`)

## Instruções
1. `useNftDetailLive(nft: NftDetail)`: `useNftSubscriptions([nft.id])` (inscreve e cancela ao sair) e um `onReconnect` próprio que invalida `nfts.detail(nft.id)` e `cart`.
2. `price_changed` do próprio NFT: `setQueryData` trocando o `price` da edição do payload; invalidar `nfts.detail(nft.id)` (campos derivados) e `cart`; marcar `updatedEditionId` por 5 s (timer limpo ao desmontar) e `announce('O preço da edição X de <nome> mudou para <valor>', 'polite')`.
3. `stock_changed` do próprio NFT: `setQueryData` trocando o `available` da edição; invalidar `nfts.detail(nft.id)` e `cart`. Não anunciar aqui (o ajuste de quantidade é do `useNftPurchase`).
4. Eventos de outros NFTs são ignorados. Devolve `{ updatedEditionId: string | null }`. Mudança em tempo real nunca move o foco.
5. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-006: tempo real do detalhe`.

## Critérios de aceite
- [ ] Sem `any`; cancela ouvintes e timers ao desmontar.
- [ ] Nenhum cálculo de valor monetário no front.

## Verificação (Sonnet)
- format:check, lint, typecheck, build.
