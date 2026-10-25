# 02-016 — Carregador do seed e reset

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Seed
**Depende de:** 02-009, 02-010, 02-012, 02-014, 02-015

## Objetivo
Popular o IndexedDB na primeira execução, quando a versão do seed mudar ou com `VITE_MOCK_SEED_RESET=true`.

## Arquivos
- criar: `src/mocks/db/seed.ts`, `src/mocks/seed/index.ts`
- alterar: `src/mocks/db/db.ts` (tipo `NftRecord`); `src/mocks/db/stores.ts` (tipo da store `nfts`) — com isso o bloco toca 4 arquivos, exceção aprovada por ser só um tipo

## Referências
- docs/api-mock/persistencia.md (versão do seed na store `meta`)

## Instruções
1. `seed/index.ts`: `SEED_VERSION` (número) e `buildSeedData()` que junta coleções, usuários, carteiras, NFTs, avaliações, favoritos do usuário de teste (`SEED_FAVORITE_IDS`) e posts/promos (estes últimos ficam em memória para o `GET /home`, não no banco).
2. `db/seed.ts`: `ensureSeeded()`: a versão efetiva é `${SEED_VERSION}:${assinatura das SEED_IMAGE_URLS}` (as URLs das imagens mudam de hash a cada build; sem isso o banco persistido ficaria com `image.src` quebrado após um novo build). Lê `meta['seedVersion']`; se não existir ou for diferente da versão efetiva, apaga o banco (`deleteMockDb`), recria e grava tudo **numa única transação por store**; grava `meta.seedVersion`. Caso contrário, não faz nada (preserva dados do usuário entre refreshes). **Reset por variável** (`mockConfig.seedReset` = `true`, como no `.env.test`): vale **uma vez por sessão da aba**. Se `storage.session.get(STORAGE_KEYS.mockSeedResetDone)` for nulo, faz o reset/reseed e, ao concluir, grava a flag `'1'` (chave `kurio:mock:seed-reset-done`, sessionStorage). Com a flag já gravada, o reset por variável é ignorado; a versão do seed e a ausência de dados continuam disparando reseed normalmente. Reload da mesma aba preserva os dados; aba ou contexto novo começa limpo.
2a. `createdAt` não faz parte de `NftDetail` (contrato); o seed o exporta à parte em `SEED_NFT_CREATED_AT` (02-014). Neste bloco, definir `NftRecord = NftDetail & { createdAt: string }` em `src/mocks/db/db.ts` (a store `nfts` passa a guardar `NftRecord`; ajustar `stores.ts` para o novo tipo) e gravar cada NFT com seu `createdAt`. Os handlers de fluxo removem o campo ao responder.
3. Retornar um resumo `{ seeded: boolean, counts: Record<string, number> }` e logar uma linha em `console.info` (só fora de `MODE === 'test'`).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/seed.ts src/mocks/seed/index.ts` e `git commit -m "02-016: carregador do seed"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Recarregar a página sem reset **não** recria o banco.
- [ ] Com reset, o banco volta ao estado do seed.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 (contagens por store, persistência entre reloads e reset).
