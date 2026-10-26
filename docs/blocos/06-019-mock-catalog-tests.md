# 06-019 — Testes do mock: catálogo e início

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Início › API (`GET /home`, `GET /nfts`)
**Depende de:** 06-014, 06-015

## Objetivo
Provar o contrato de `GET /home` e `GET /nfts` (filtros, ordenação, paginação, `facets`, favoritos, validação e cenários) por `fetch` dentro da página, sem nenhuma tela.

## Arquivos
- criar: `tests/e2e/catalog-mock.spec.ts`

## Referências
- `tests/e2e/auth-mock.spec.ts` (padrão: `test.skip` no mobile, função `call`, login por `POST /api/auth/login` com `users.primary` de `fixtures.ts`) e `tests/e2e/helpers.ts` (`openApp(page, scenarios?)`)
- docs/api-mock/contratos.md e cenarios.md; `window.__kurioMock.stores.nftsStore` (para calcular o esperado **a partir do banco**, nunca de números fixos além dos do seed abaixo)

## Instruções
O Sonnet escreve. Só no projeto `desktop` (o mock é o mesmo nos dois).
1. **`GET /home`:** valida em `window.__kurio.schemas.nft.homeResponseSchema`; `hero` com 3 NFTs, `featured` com 1, `promos` com 2 (`query.tab: 'new'` e `query.collection: 'arte-digital'`) e `posts` com 4; todos os NFTs têm `soldOut` booleano; sem token, sem `isFavorite`; com token, `isFavorite` booleano.
2. **`GET /nfts` padrão:** valida em `catalogResponseSchema`; `page: 1`, `pageSize: 9`, `total: 283`, `totalPages: 32`; os 3 primeiros nomes são "Emerald Ape #042", "Sage Nomad #009", "Neon Vessel #552"; nenhum item tem `stats`, `createdAt` nem `editions`; `facets`: coleções somam 283 e redes somam 283; `priceRange.min`/`max` são strings de ETH.
3. **Abas:** `tab=new` → `total` 39 e todos com `createdAt` (lido do banco) até 30 dias antes do NFT mais recente; `tab=trending` → `total` 48; `tab=all` igual ao padrão.
4. **Filtros e combinação:** `collection=musica` → `total` 77; `network=solana` → 86; `collection=musica&network=solana` → o número calculado pelo teste sobre `nftsStore.getAll()`; faixa `minPrice`/`maxPrice` mantém só os NFTs dentro dela (conferir cada `price` com `window.__kurioMock.money.ethToUnits`); tudo junto (`q` + `tab` + `collection` + `network` + faixa) = interseção calculada pelo teste.
5. **`facets` excluem o próprio grupo:** com `network=ethereum`, as coleções somam 119 e as redes continuam 119/78/86; com `collection=musica`, as redes somam 77 e as coleções continuam 39/14/77/…; a ordem das coleções é a do Figma (Arte digital, Fotografia, Música, Arte 3D, …); `priceRange` **não muda** com filtros.
6. **Ordenações:** `price_asc` e `price_desc` ordenados por `ethToUnits`; `top_rated` por `rating` (lido do banco) decrescente; `most_favorited` por `stats.favoritesTotal` decrescente (sem favoritos reais além do seed); `recent` por `createdAt` decrescente; empate → id alfabético; duas chamadas iguais dão a mesma ordem.
7. **Busca:** `q=ape` só traz nomes/coleções/atributos com "ape"; `q=musica` (sem acento) acha a coleção "Música"; `q=%230042` e `q=0042` acham o `#0042`; `q=zzzz` → `200`, `items: []`, `total: 0`, `totalPages: 0`.
8. **Paginação:** `page=2` traz os itens 10 a 18 da lista; `pageSize=18&page=1` = `page=1` + `page=2` do `pageSize=9`; `page=99` → `200`, `items: []`, `page: 99`.
9. **Validação (`422 VALIDATION_ERROR` com o campo em `fields`):** `page=0`, `page=abc`, `pageSize=301`, `tab=x`, `sort=y`, `network=bitcoin`, `minPrice=abc`, `minPrice=2&maxPrice=1` (campo `maxPrice`), `favorites=2`.
10. **Favoritos e `isFavorite`:** `favorites=1` sem token → `401 UNAUTHORIZED`; com token do `users.primary` → 12 itens, todos `isFavorite: true`; `favorites=1&q=ape` filtra dentro dos favoritos; sem `favorites`, a lista com token marca `isFavorite` e sem token **não** tem a chave; token inválido em `GET /nfts` (sem `favorites`) → `200` como visitante.
11. **Cenários:** `empty-catalog` → `items: []`, `total: 0`, `facets.priceRange` `0.00`/`0.00`, coleções e redes com `count: 0` (e `GET /home` continua `200`); `server-error:GET /nfts` → `500` `INTERNAL_ERROR` (e `GET /home` `200`); `server-error:GET /home` → `500`; `offline` → a requisição falha (rede); `session-expired` + `favorites=1` → `401 SESSION_EXPIRED`, mas `GET /nfts` sem `favorites` → `200`.
12. **Consistência com o tempo real:** `window.__kurioMock.triggerPriceChange` numa edição do `emerald-ape-042` muda `price`/`previousPrice` em `GET /nfts`; `triggerStockChange(..., 0)` em **todas** as edições limitadas de um NFT (lidas do banco) deixa `soldOut: true` e sem `defaultEditionId`; um NFT com edição `ABERTA` nunca fica `soldOut`.
Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0. Commit: `git add tests/e2e/catalog-mock.spec.ts` e `git commit -m "06-019: testes do mock do catálogo"`.

## Critérios de aceite
- [ ] Passa no projeto `desktop`, duas execuções seguidas; sem `data-testid` nem seletor CSS.
- [ ] O esperado vem do banco (`nftsStore`), exceto os totais do seed (283, 39, 48, 77, 86, 119/78/86, 12 favoritos).

## Verificação (Sonnet)
- `npm run test:e2e -- catalog-mock` verde; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
