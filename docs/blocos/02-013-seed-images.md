# 02-013 — Seed: imagens dos NFTs (do Figma)

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 02 › Seed
**Depende de:** 02-012

## Objetivo
Trazer para o projeto as imagens-base dos NFTs usadas no Figma.

## Arquivos
- criar: `src/assets/nfts/*` (somente imagens)

## Referências
- docs/design/telas/README.md (nós do Figma)
- Autorização do usuário: chamadas ao Figma para baixar as imagens (2026-10-25)

## Instruções
1. O Sonnet baixou do Figma (frame `2:2`, uma chamada `download_assets`) as **4 imagens-base** dos NFTs: macaco de jaqueta verde e óculos, macaco laranja com fones, gorila de capuz roxo e chapéu, gorila preto de blazer bege. Os cards de promoção e os posts do "Diário da Cunhagem" no Figma reutilizam as mesmas 4 imagens, então **não há** `src/assets/content/`.
2. Originais PNG de 1254 px (≈ 2 MB cada) foram redimensionados para 800 px e salvos em **WebP** (qualidade 80, 33–47 KB): `ape-green-jacket.webp`, `ape-orange-headphones.webp`, `gorilla-purple-hoodie.webp`, `gorilla-black-blazer.webp` em `src/assets/nfts/`. (Desvio do plano original de manter o formato do Figma: o WebP já atende a meta de imagens do Lighthouse da fase 13.)
3. `alt` em PT-BR para o seed (02-014/02-015): "Macaco de óculos escuros e jaqueta verde", "Macaco laranja com fones de ouvido verdes", "Gorila cinza de capuz roxo e chapéu verde", "Gorila preto de blazer bege e gola verde".
Commit: `git add src/assets/nfts docs/blocos/02-013-seed-images.md` e `git commit -m "02-013: imagens dos NFTs do Figma"`.

## Critérios de aceite
- [ ] 4 imagens distintas, cada uma < 400 KB.
- [ ] Nenhuma imagem inventada ou gerada; só as do Figma.

## Verificação (Sonnet)
- O Sonnet confere visualmente cada imagem contra as capturas.
