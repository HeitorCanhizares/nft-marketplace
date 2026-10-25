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
1. O Sonnet identifica no Figma (frame `2:2`, grade do catálogo e hero) as imagens distintas dos NFTs (esperado: macaco de jaqueta verde e óculos, gorila de capuz roxo e chapéu, gorila preto de blazer bege, macaco laranja com fones) e as baixa com a ferramenta de assets do Figma, no menor número de chamadas possível.
2. Salvar em `src/assets/nfts/` com nomes descritivos (`ape-green-jacket.png`...), formato como vier do Figma. A conversão para WebP/AVIF é da fase 13 (Lighthouse), e fica registrada lá.
3. Também registrar `alt` descritivo em PT-BR de cada imagem num comentário do bloco 02-014 (o texto vai para o seed).
Commit: `git add src/assets/nfts` e `git commit -m "02-013: imagens dos NFTs do Figma"`.

## Critérios de aceite
- [ ] 4 a 6 imagens distintas, cada uma < 400 KB.
- [ ] Nenhuma imagem inventada ou gerada; só as do Figma.

## Verificação (Sonnet)
- O Sonnet confere visualmente cada imagem contra as capturas.
