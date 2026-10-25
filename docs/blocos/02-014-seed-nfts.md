# 02-014 — Seed: 283 NFTs determinísticos

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Seed
**Depende de:** 02-012, 02-013

## Objetivo
Gerar o catálogo com 283 NFTs, edições, preços, estoques e redes, de forma determinística.

## Arquivos
- criar: `src/mocks/seed/nfts.ts`

## Referências
- docs/api-mock/contratos.md#tipos-principais e #nfts
- docs/design/telas/desktop-inicio.png, mobile-inicio.png (nomes e preços da primeira página)
- docs/fluxos/inicio.md (abas, ordenações)
- Decisão do usuário: 283 NFTs, coleções escaladas (02-012), redes 119/78/86

## Instruções
1. Exportar `buildSeedNfts(): NftDetail[]` **puro e determinístico** (PRNG com semente fixa, por exemplo mulberry32; nunca `Math.random`). Resultado idêntico a cada chamada.
2. Os **9 primeiros** itens (mais recentes) reproduzem a primeira página do Figma desktop, com id em slug (`emerald-ape-042`), `tokenId` e preço: Emerald Ape #042 1.19; Sage Nomad #009 1.69; Neon Vessel #552 1.99 (preço anterior 2.29, selo `rare`); Cosmic Bloom #118 1.29; Violet Nomad #314 1.39; Ivory Baron #088 1.79; Golden Beat #207 0.99; Golden Frequency #071 0.59; Golden Signal #160 0.39. O ID do token vem **do dado**, nunca fixo na interface.
3. Os demais (até 283) são gerados com nomes `<Adjetivo> <Substantivo> #NNN` únicos, imagens-base reaproveitadas, `alt` em PT-BR, preço entre 0.05 e 4.50 ETH, `createdAt` espalhado pelos últimos 120 dias (pelo menos 30 dentro dos 30 dias, para a aba "Novos"), `network` e `collection` distribuídos para fechar **exatamente**: redes 119/78/86 e coleções conforme `collections.ts`.
4. Cada NFT tem 1 a 4 edições entre `1/1` (supply 1), `1/10`, `1/50` e `ABERTA` (`supply: null`, `available: null`); estoques variados, com **alguns esgotados** (`available: 0`) e **alguns com pouco estoque** (1–3); o preço do NFT (`NftSummary.price`) é o menor entre as edições disponíveis.
5. `rating` (`average` 3.5–5.0, `count` 0–25) é consistente com as avaliações do 02-015; Emerald Ape #042 tem `count: 19`, média `4.8` (valores do Figma).
6. Atributos, descrição, 1–4 imagens e `details` (corpo, rede, contrato `0x`+40 hex, royalties) preenchidos em PT-BR.
7. Garantir pelo menos: 12 NFTs favoritos do usuário de teste (ids exportados em `SEED_FAVORITE_IDS`), 5 NFTs `rare`, 8 NFTs com preço anterior.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/seed/nfts.ts` e `git commit -m "02-014: seed de 283 NFTs"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Exatamente 283 NFTs, ids únicos.
- [ ] Contagens por rede e por coleção batem com o planejado.
- [ ] Duas chamadas seguidas geram dados idênticos.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Script de conferência no navegador (02-022): contagens por rede e coleção, ≥ 30 NFTs nos últimos 30 dias, presença de esgotados e de `rare`.
