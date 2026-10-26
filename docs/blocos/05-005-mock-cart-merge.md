# 05-005 — Mock: mescla do carrinho do visitante

**Status:** concluído
**Fluxo / subitem:** Login › 4 e Cadastro › 5 (carrinho do visitante mesclado; ajustes por estoque avisados)
**Depende de:** 02-009, 02-010, 05-004
**Depende de decisão:** pergunta 12 do relatório da fase 05 (convenção de ids do carrinho, estoque baixo, item removido)

## Objetivo
Criar a rotina do mock que mescla o carrinho do visitante (`X-Cart-Id`) no carrinho do usuário no login e no cadastro, respeitando o estoque e devolvendo os ajustes (`CartAdjustment`).

## Arquivos
- criar: `src/mocks/db/cartMerge.ts`

## Referências
- docs/api-mock/contratos.md (Carrinho: mescla no login; mesmos NFT e edição somam respeitando o estoque; excedente descartado e informado em `details.adjustments`; cupom do visitante prevalece se o usuário não tinha um) e decisão A1
- `src/types/cart.ts` (`Cart`, `CartItem`, `CartAdjustment`), `src/mocks/db/db.ts` (`CartRecord = Cart & { ownerId }`), `src/mocks/db/stores.ts` (`cartsStore`, `nftsStore`), `src/mocks/db/money.ts` (05-004)
- Os handlers de carrinho e a cotação são das fases 07 e 08; **este bloco só define a convenção de ids** que elas devem seguir.

## Instruções
1. Convenção (comentar no topo do arquivo; o Opus replica em contratos.md): **carrinho do usuário** → `id = 'cart-' + userId`, `ownerId = userId`; **carrinho de visitante** → `id = <valor do X-Cart-Id>`, `ownerId = <o mesmo valor>`.
2. `export function userCartId(userId: string): string`.
3. `export type CartMergeResult = { cart: CartRecord | null; adjustments: CartAdjustment[] }`.
4. `export async function mergeGuestCart(userId: string, guestCartId: string | null): Promise<CartMergeResult>`:
   - `guestCartId` nulo, carrinho de visitante inexistente ou sem itens → devolve `{ cart: carrinho atual do usuário ou null, adjustments: [] }` **sem escrever nada**.
   - Parte do carrinho do usuário (`cartsStore.get(userCartId(userId))`) ou de um vazio `{ id, ownerId: userId, items: [], itemCount: 0, version: 0 }`.
   - Para cada item do visitante, na ordem: chave `nft.id + ':' + edition.id`. Se o usuário já tem a chave, `requested = existente.quantity + visitante.quantity`; senão `requested = visitante.quantity`.
   - Estoque atual: `nftsStore.get(nft.id)` → edição com o mesmo id; `available` `null` = ilimitado. NFT ou edição inexistente → `applied = 0`.
   - `applied = available === null ? requested : Math.min(requested, available)`. Se `applied < requested`: `adjustments.push({ nftId, nftName, editionId, editionLabel, requested, applied, reason: 'stock' })` (`nftName` = `name` do registro do catálogo).
   - `applied === 0` → o item sai do carrinho (do usuário também, se existia). Senão grava `quantity = applied`, `unitPrice` = preço atual da edição, `lineTotal = multiplyEth(unitPrice, applied)`, `available` = estoque atual, `availability = 'available'` (a regra de `low_stock` é recalculada pelo `GET /cart` da fase 08; ver pergunta 12), reaproveitando o `nft` do item (resumo do catálogo) e o `id` do item do visitante quando o item é novo.
   - Itens do usuário que o visitante não tocou **ficam como estão**.
   - Cupom: `cart.coupon ??= guest.coupon` (o do visitante prevalece só se o usuário não tinha).
   - `itemCount` = soma das quantidades; `version` = versão anterior + 1.
   - Grava o carrinho do usuário (`cartsStore.put`) e **apaga** o do visitante (`cartsStore.delete`). Devolve `{ cart, adjustments }`.
5. Sem dependência do app (só `types`, `schemas`, `lib` e o resto de `mocks`).
6. Fechamento: `npx prettier --write src/mocks/db/cartMerge.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/cartMerge.ts` e `git commit -m "05-005: mescla do carrinho do visitante"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nenhuma soma de ETH com `number` decimal (usa `multiplyEth`).
- [ ] Mesmo NFT e edição somam; estoque 3 com 2 + 4 pedidos → `applied: 3` e um ajuste `{ requested: 6, applied: 3 }`.
- [ ] Estoque 0 → item removido, ajuste `applied: 0`.
- [ ] Item só do visitante com quantidade acima do estoque também gera ajuste.
- [ ] Cupom: usuário sem cupom herda o do visitante; usuário com cupom mantém o dele.
- [ ] Carrinho do visitante apagado depois da mescla; sem visitante, nada é escrito.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 05-012 (mescla por `fetch` no login e no cadastro, carrinhos plantados com `window.__kurioMock.stores.cartsStore`).
