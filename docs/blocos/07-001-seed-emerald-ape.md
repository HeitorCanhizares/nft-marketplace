# 07-001 — Seed: Emerald Ape #042 igual ao Figma

**Status:** pendente
**Fluxo / subitem:** Detalhes › 1, 3 (galeria e edições; dado para a baseline visual)
**Depende de:** 06-068
**Depende de decisão:** pergunta 1 do relatório da fase 07

## Objetivo
Fazer o NFT `emerald-ape-042` ter 4 imagens, as 4 edições e os textos do Figma (hoje o seed sorteia imagens e edições).

## Arquivos
- alterar: `src/mocks/seed/nfts.ts`
- alterar: `src/mocks/seed/index.ts` (só `SEED_VERSION` 2 → 3)

## Referências
- Tela: docs/design/telas/desktop-detalhes.png
- `src/mocks/seed/nfts.ts` (`buildNft`, `EDITION_SPECS`, `BASE_IMAGES`)

## Instruções
1. Depois de montar o NFT `emerald-ape-042` (primeiro de `FIGMA_NFTS`), sobrescrever **só ele**: `images` = as 4 `BASE_IMAGES` (a verde primeiro; `image` = `images[0]`); `attributes` = `['Óculos','Esmeralda','Raro']`; `description` = "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores."
2. `editions` fixas, nesta ordem, ids no padrão atual (`emerald-ape-042-1-1`, `-1-10`, `-1-50`, `-aberta`): 1/1 (`supply` 1, `available` 1, `1.49`), 1/10 (10, 6, `1.39`), 1/50 (50, 20, `1.19`), ABERTA (`null`, `null`, `1.29`). O `price` do NFT continua `1.19` (a de 1/50 é a mais barata).
3. Se a coleção do NFT não se chamar "Kurio Apes", **pare e pergunte**.
4. Subir `SEED_VERSION` para 3. Não mexer em mais nenhum NFT.
5. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `07-001: seed do Emerald Ape`.

## Critérios de aceite
- [ ] Sem `any`; os outros 282 NFTs idênticos aos de antes (mesma semente).
- [ ] No app: `emerald-ape-042` com 4 imagens, 4 edições, `price` `1.19`.

## Verificação (Sonnet)
- format:check, lint, typecheck, build; `npm run test:e2e -- catalog-mock` verde.
