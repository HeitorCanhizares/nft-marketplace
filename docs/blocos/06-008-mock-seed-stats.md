# 06-008 — Estatísticas do seed (vendas e favoritos)

**Status:** concluído
**Fluxo / subitem:** Início › 4 e 5 (aba "Em alta" e ordenação "Mais favoritados")
**Depende de:** 02-014, 02-016
**Depende de decisão:** pergunta 2 do relatório da fase 06 (estatísticas no seed e o que é "Em alta")

## Objetivo
Dar a cada NFT do seed números de vendas e favoritos, determinísticos, para o mock decidir quem está "em alta" e ordenar por "mais favoritados".

## Arquivos
- alterar: `src/mocks/db/db.ts`
- alterar: `src/mocks/seed/nfts.ts`
- alterar: `src/mocks/seed/index.ts`

## Referências
- docs/fluxos/inicio.md (subitem 4: "Em alta = mais vendidos e favoritados nos últimos 7 dias"; subitem 5: "Mais favoritados") e docs/api-mock/persistencia.md (store `nfts`)
- `src/mocks/seed/nfts.ts` (o gerador usa **um** `mulberry32(SEED)`: **não** consumir números dele, senão o catálogo inteiro muda)

## Instruções
1. `db.ts`: exportar `NftStats = { sales7d: number; favorites7d: number; favoritesTotal: number }` e acrescentar `stats: NftStats` a `NftRecord` (junto de `createdAt`). Comentar: "fora do contrato; os handlers removem ao responder".
2. `nfts.ts`: exportar `SEED_NFT_STATS: Readonly<Record<string, NftStats>>`, calculado **depois** de `SEED_ENTRIES`, com um **gerador próprio** `mulberry32(SEED ^ 0x5eed)` (semente separada). Para cada NFT, na ordem de `SEED_ENTRIES`: `sales7d` inteiro 0–40, `favorites7d` inteiro 0–60, `favoritesTotal` inteiro `favorites7d`–400. Os 9 primeiros (os do Figma) ganham `favoritesTotal` pelo menos 150.
3. `index.ts`: em `buildSeedData`, acrescentar `stats: SEED_NFT_STATS[nft.id]` ao montar cada `NftRecord`; subir `SEED_VERSION` de `1` para `2` (o banco do navegador é recriado).
4. Conferir que o catálogo não mudou: os ids, nomes, preços e a ordem por `createdAt` são exatamente os de antes (o Sonnet compara).
5. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/db/db.ts src/mocks/seed/nfts.ts src/mocks/seed/index.ts` e `git commit -m "06-008: estatísticas do seed"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `NftRecord.stats` obrigatório e preenchido para os 283 NFTs.
- [ ] Mesmo seed, mesmas estatísticas em duas execuções; os 283 NFTs têm os mesmos ids de antes.
- [ ] `tests/e2e/mock-base.spec.ts` continua verde (a versão do seed mudou; o teste do reseed pode ter o número `1` fixo: se tiver, **parar e relatar**).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- mock-base` verde; no navegador, `await window.__kurioMock.stores.nftsStore.getAll()` mostra `stats` em todos.
