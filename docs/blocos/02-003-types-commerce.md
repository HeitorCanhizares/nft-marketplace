# 02-003 — Tipos de carrinho, cotação e pedido

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Tipos de domínio
**Depende de:** 02-001, 02-002

## Objetivo
Criar os tipos do carrinho, da cotação e dos pedidos.

## Arquivos
- criar: `src/types/cart.ts`, `src/types/order.ts`

## Referências
- docs/api-mock/contratos.md#tipos-principais, #carrinho, #cotação, #pedidos

## Instruções
1. `cart.ts`: `CartItem` (inclui `availability` e `available`), `Cart` (com `itemCount`, `version` e `coupon?: { code: string }`), `Quote` (com `warnings`, `items[].priceChanged?` e `coupon?`).
2. `order.ts`: `OrderStatus`, `OrderItemSnapshot`, `Order`, `QuoteChange` (`'PRICE_CHANGED' | 'SOLD_OUT' | 'COUPON_EXPIRED' | 'FEE_CHANGED'`) e `CreateOrderInput` (`{ quoteId; collector; walletId?; network; provider; walletAddress; note? }`).
3. Importar `NftSummary`, `Edition`, `Network` e `WalletProvider` de `src/types/nft.ts` e `Wallet` de `src/types/user.ts`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/types/cart.ts src/types/order.ts` e `git commit -m "02-003: tipos de carrinho e pedido"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferir campo a campo contra `contratos.md`.
