# 06-017 — Mock: regra de adicionar item ao carrinho

**Status:** pendente
**Fluxo / subitem:** Início › 8 (adicionar ao carrinho pelo card)
**Depende de:** 06-009, 05-004, 05-005, 02-009
**Depende de decisão:** pergunta 5 do relatório da fase 06 (só `POST /cart/items` entra agora)

## Objetivo
Criar a regra pura de "adicionar ao carrinho": soma no item existente, limita ao estoque, calcula as linhas e devolve o `Cart`.

## Arquivos
- criar: `src/mocks/db/cartAdd.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: "Adicionar o mesmo NFT e a mesma edição **soma** a quantidade, limitada ao estoque da edição"; quantidades inteiras ≥ 1; `CartItem.availability`: `available` | `low_stock` | `sold_out` | `insufficient`)
- `src/mocks/db/cartMerge.ts` (convenção `cart-<userId>`; o mesmo formato de `CartItem`), `src/mocks/db/money.ts` (`multiplyEth`), `src/mocks/db/stores.ts` (`cartsStore`, `nftsStore`), `src/mocks/db/nftSummary.ts`

## Instruções
1. `addToCart(owner: { cartId: string; ownerId: string }, input: { nftId: string; editionId: string; quantity: number }): Promise<{ ok: true; cart: CartRecord } | { ok: false; code: 'NOT_FOUND' | 'SOLD_OUT' | 'QUANTITY_EXCEEDS_STOCK'; message: string; details?: Record<string, unknown> }>`:
   1. NFT ou edição inexistente → `NOT_FOUND` ("Não encontramos este NFT.");
   2. edição com `available === 0` → `SOLD_OUT` ("Este NFT esgotou.");
   3. carrinho = `cartsStore.get(cartId)` ou um novo `{ id: cartId, ownerId, items: [], itemCount: 0, version: 0 }`; quantidade nova = a do item existente (mesmo `nft.id` e `edition.id`) + `quantity`;
   4. `available !== null` e quantidade nova > `available` → `QUANTITY_EXCEEDS_STOCK` ("Você já tem o máximo disponível deste NFT no carrinho.", `details: { available, inCart }`), **sem** gravar nada;
   5. grava o item: `id` existente ou `item-<uuid>`, `nft: toNftSummary(record)` (sem `isFavorite`), `edition: { id, label }`, `quantity`, `unitPrice: edition.price`, `lineTotal: multiplyEth(price, quantity)`, `availability`: `low_stock` quando `available !== null && available <= 3`, senão `available`, e `available: edition.available`;
   6. `itemCount` = soma das quantidades; `version + 1`; `cartsStore.put`; devolve o carrinho.
2. Sem `msw`. Fechamento: `npx prettier --write src/mocks/db/cartAdd.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/cartAdd.ts` e `git commit -m "06-017: regra de adicionar ao carrinho no mock"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; o `cart` resultante valida em `cartSchema`.
- [ ] Adicionar 1 + 1 do mesmo NFT e edição → 1 linha com `quantity: 2`; estoque 1 e quantidade 2 → `QUANTITY_EXCEEDS_STOCK` e o carrinho continua com 1.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-020.
