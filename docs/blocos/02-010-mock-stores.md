# 02-010 — Acessores das stores

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Banco e stores
**Depende de:** 02-009

## Objetivo
Expor funções pequenas e tipadas de leitura e escrita sobre as stores, para os handlers futuros.

## Arquivos
- criar: `src/mocks/db/stores.ts`

## Referências
- docs/api-mock/persistencia.md

## Instruções
1. Para cada store, funções `get`, `put`, `delete`, `getAll` (as que fizerem sentido): ex. `usersStore.getByEmail`, `usersStore.getByUsername`, `sessionsStore.get/put/delete`, `walletsStore.getByUserId`, `reviewsStore.getByNftId`, `favoritesStore.listByUserId/add/remove`, `cartsStore`, `quotesStore`, `ordersStore.listByUserId`, `idempotencyStore`, `avatarsStore` (Blob), `metaStore`.
2. `ordersStore.put` **não pode alterar** o snapshot depois de criado: ao regravar um pedido existente, só `status`, `txHash`, `explorerUrl` e `declineReason` mudam (os demais campos vêm do registro já salvo).
3. Cada função abre a transação certa e retorna tipos de `src/types`; sem lógica de negócio (cálculo de cotação, estoque etc. nascem com os fluxos).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/stores.ts` e `git commit -m "02-010: acessores das stores"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Pedido regravado mantém o snapshot imutável.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- O Sonnet roda um teste de navegador que grava um pedido, tenta mudar `total` e confirma que o valor original permanece (no 02-022).
