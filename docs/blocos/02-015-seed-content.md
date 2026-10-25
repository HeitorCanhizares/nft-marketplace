# 02-015 — Seed: posts, promoções e avaliações

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Seed
**Depende de:** 02-014

## Objetivo
Criar o conteúdo editorial e as avaliações de cada NFT.

## Arquivos
- criar: `src/mocks/seed/content.ts`

## Referências
- docs/design/telas/desktop-inicio.png (promos e "Diário da Cunhagem")
- docs/fluxos/inicio.md, docs/fluxos/detalhes-nft.md

## Instruções
1. `SEED_POSTS` (4 posts: data, tempo de leitura, título e resumo em PT-BR, como no "Diário da Cunhagem") e `SEED_PROMOS` (2: "Lançamentos gênesis..." e "Arte digital selecionada...", cada uma com `query` que leva ao catálogo filtrado por coleção ou ordenação).
2. `buildSeedReviews(nfts: NftDetail[]): Review[]` determinístico: para cada NFT gera exatamente `rating.count` avaliações com nota coerente com `rating.average` (média arredondada igual), autor fictício e texto curto em PT-BR, `createdAt` espalhado. Sem dado pessoal real.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/seed/content.ts` e `git commit -m "02-015: posts, promoções e avaliações"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Para todo NFT: quantidade de avaliações = `rating.count` e média arredondada = `rating.average`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferência no 02-022 (contagem e média por NFT).
