# 06-020 — Testes do mock: favoritos e adicionar ao carrinho

**Status:** concluído
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › API (`/favorites`, `POST /cart/items`)
**Depende de:** 06-016, 06-018

## Objetivo
Provar os handlers de favoritos e de adicionar ao carrinho por `fetch` dentro da página.

## Arquivos
- criar: `tests/e2e/favorites-cart-mock.spec.ts`

## Referências
- `tests/e2e/auth-mock.spec.ts` (função `call`, login por API, `X-Cart-Id`, `StoredCart`), `tests/e2e/fixtures.ts` (`users.primary`, `users.other`)
- docs/api-mock/contratos.md (Favoritos e Carrinho) e cenarios.md

## Instruções
O Sonnet escreve. Só no projeto `desktop`.
1. **Favoritos:** sem token, `GET/PUT/DELETE` → `401 UNAUTHORIZED`; com `session-expired` → `401 SESSION_EXPIRED`; `GET /favorites` do `users.primary` → 12 ids (os do seed); `PUT /favorites/<id>` duas vezes → `204` nas duas e o id aparece **uma vez**; `DELETE` duas vezes → `204`; `PUT` de id inexistente → `404 NOT_FOUND`; os favoritos do `users.other` são independentes (começa com 0).
2. **`isFavorite` acompanha:** depois do `PUT`, `GET /nfts?favorites=1` inclui o NFT; depois do `DELETE`, sai.
3. **Adicionar (visitante):** `POST /cart/items` com `X-Cart-Id` e `{ nftId, editionId, quantity: 1 }` (NFT e edição lidos do banco) → `200`, `id` = o `X-Cart-Id`, 1 linha com `quantity: 1`, `unitPrice` = preço da edição, `lineTotal` = o mesmo, `itemCount: 1`, `version` 1; valida em `cartSchema` e **sem** `ownerId`; repetir → 1 linha com `quantity: 2`; `nft` da linha sem `isFavorite`.
4. **Estoque:** edição com 1 em estoque (ajustar pelo `nftsStore.put`): a 2ª adição → `422 QUANTITY_EXCEEDS_STOCK` com `details.available` e o carrinho **não** muda; edição com `available: 0` → `409 SOLD_OUT`; edição `ABERTA` aceita quantidades grandes; `availability: 'low_stock'` com estoque ≤ 3.
5. **Validação:** `quantity: 0`, `quantity: 1.5`, `quantity: '1'`, sem `nftId`, corpo que não é objeto → `422`/`400` com `fields` quando for o caso; NFT ou edição inexistente → `404`; sem `Authorization` e sem `X-Cart-Id` → `400 BAD_REQUEST`.
6. **Logado:** com token do `users.primary`, a linha vai para o carrinho `cart-user-teste` (ver `cartsStore`); com token vencido (`sessionsStore.put` com `expiresAt` no passado) → `401 SESSION_EXPIRED`; `server-error:POST /cart/items` → `500`.
7. **Integração com a mescla (05-005):** adicionar como visitante, entrar (`POST /auth/login` com o mesmo `X-Cart-Id`) e ver a linha em `cart-user-teste`; o carrinho do visitante some.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/favorites-cart-mock.spec.ts` e `git commit -m "06-020: testes do mock de favoritos e carrinho"`.

## Critérios de aceite
- [ ] Passa no projeto `desktop`, duas execuções seguidas; sem `data-testid` nem seletor CSS.

## Verificação (Sonnet)
- `npm run test:e2e -- favorites-cart-mock` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
