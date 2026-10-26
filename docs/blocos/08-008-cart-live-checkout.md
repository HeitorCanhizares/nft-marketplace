# 08-008 — `useCartLive` e regra do botão "Conectar e finalizar"

**Status:** concluído
**Fluxo / subitem:** Carrinho › 7 (tempo real), 9 (ir para o pagamento)
**Depende de:** 08-005

## Objetivo
Inscrever os NFTs do carrinho no tempo real (preço e estoque) e centralizar quando o fechamento do pedido fica bloqueado.

## Arquivos
- criar: `src/hooks/useCartLive.ts`
- criar: `src/lib/cartCheckout.ts`

## Referências
- docs/api-mock/realtime.md (`nft:price_changed` e `nft:stock_changed` → **invalidam `cart` e `quote`**; reconexão invalida; mudanças em tempo real **nunca movem o foco**, são anunciadas)
- docs/fluxos/carrinho.md (subitens 7 e 9)
- `src/hooks/useNftDetailLive.ts` (modelo: `useNftSubscriptions`, `onSocketEvent`, `onReconnect`, anúncio), `src/hooks/useNftSubscriptions.ts`, `src/lib/formatEth.ts` (`formatEthSpoken`)

## Instruções
1. `useCartLive(cart: Cart | undefined)`: `useNftSubscriptions(ids dos NFTs das linhas)`; em `nft:price_changed` e `nft:stock_changed` de um NFT que **está** no carrinho, `invalidateQueries` de `cart` e `quote`; eventos de NFT que não está no carrinho são ignorados; ao reconectar (`onReconnect`), invalidar `cart` e `quote`. Anúncios `polite`, **agrupados** (uma janela de ~1 s, como `useLiveChanges`): "O preço de {nome} mudou para {preço}" e "{nome} esgotou" / "Restam N de {nome}". **Nunca mexe no foco** nem remove linhas.
2. `lib/cartCheckout.ts` (função pura, **sem React**): `getCheckoutState(items: readonly CartItem[]): { canCheckout: boolean; reason: string | null; blockedIds: string[] }`. Bloqueia quando: carrinho vazio ("Seu carrinho está vazio."), há linha `sold_out` ("Remova os itens esgotados para continuar.") ou `insufficient` ("Ajuste as quantidades acima do estoque para continuar."). Prioridade: vazio, esgotado, estoque. `blockedIds` = ids das linhas que bloqueiam. Não olha preço nem cotação.
3. Também exportar `checkoutTarget(isAuthenticated: boolean)` → `{ to: '/pagamento' }` quando logado, ou `{ to: '/entrar', search: { redirect: '/pagamento' } }` quando não (conferir o tipo de `search` em `src/lib/redirect.ts`/`validateAuthSearch`).
4. Fechamento: prettier nos 2; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `08-008: tempo real e regra do fechamento`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem `ref` no render; `cartCheckout.ts` sem importar React.
- [ ] Evento de preço/estoque de um NFT do carrinho invalida `cart` e `quote`; evento de outro NFT não.
- [ ] Ao sair da página as inscrições são canceladas (garantido por `useNftSubscriptions`).
- [ ] `getCheckoutState([])` bloqueia; com uma linha `sold_out` bloqueia e devolve o id; só com `low_stock` libera.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Tempo real e bloqueio: casos de borda no 08-015 (fase 13); o botão bloqueado do carrinho vazio é coberto no 08-013.
