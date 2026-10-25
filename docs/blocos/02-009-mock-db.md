# 02-009 — Banco do mock (IndexedDB)

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Banco e stores
**Depende de:** 02-001, 02-002, 02-003

## Objetivo
Abrir o banco `kurio-mock-db` com todas as stores e índices da persistência, tipado.

## Arquivos
- criar: `src/mocks/db/db.ts`

## Referências
- docs/api-mock/persistencia.md#indexeddb--banco-do-mock-kurio-mock-db
- Dependência `idb` (A7), já instalada

## Instruções
1. `openMockDb()` com `openDB` do `idb`, `DBSchema` tipado e `DB_VERSION` constante. Stores e chaves **exatamente** como na tabela: `nfts` (`id`), `collections` (`id`), `users` (`id`; índices únicos `email` e `username`), `sessions` (`token`), `carts` (`id`), `quotes` (`id`), `orders` (`id`), `idempotency` (`key`), `favorites` (chave composta `[userId, nftId]`), `wallets` (`id`; índice `userId`), `avatars` (`userId`), `reviews` (`id`; índice `nftId`), `meta` (`key`).
2. Os registros usam os tipos de `src/types/*`; onde o banco guarda a mais (ex.: `users` com `passwordHash`, `sessions` com `userId`, `orders` com `userId`, `idempotency` com `bodyHash`, `carts` com `ownerId`), declarar tipos `*Record` neste arquivo.
3. Exportar `getDb()` que abre uma vez (promessa em cache) e `deleteMockDb()` (usado no reset do seed).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/db.ts` e `git commit -m "02-009: banco IndexedDB do mock"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] As 13 stores existem com as chaves e índices da tabela.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 (stores presentes via `indexedDB.open` em `page.evaluate`).
