# 06-037 — `NftCard`

**Status:** pendente
**Fluxo / subitem:** Início › 8 (o card inteiro abre o detalhe; preço, selo RARO, esgotado) e 11 (selo "Atualizado")
**Depende de:** 06-002, 06-032, 06-033, 06-036, 06-001
**Depende de decisão:** pergunta 15 do relatório da fase 06 (mobile sem carrinho no card)

## Objetivo
Criar o card do NFT da grade da Início: imagem, selos, ações, nome (link para o detalhe, cobrindo o card inteiro) e preço, com a aparência do desktop e do mobile.

## Arquivos
- criar: `src/components/shared/NftCard.tsx`

## Referências
- docs/design/componentes.md (`NftCard`) e docs/fluxos/inicio.md (subitem 8) e docs/qualidade/acessibilidade.md ("Cards de NFT: o card inteiro é um link"; `alt` vindo da API)
- Capturas 1:1 (`desktop-inicio.png`, `mobile-inicio.png`) e a tabela de medidas abaixo; `src/components/shared/NftCardActions.tsx`, `PriceTag.tsx`, `RarityBadge.tsx`, `PriceChangedNotice.tsx`

## Medidas lidas nas capturas
| Item | Desktop (1440) | Mobile (414) |
|---|---|---|
| Bloco do card | 258×300, `bg-card`, sem raio | 175×200, `bg-card`, raio 20 (`rounded-card`) |
| Imagem | 250×250 (4 px de cada lado, centralizada na vertical), raio 12 (`rounded-media`) | 168×168 (centralizada), raio 12 |
| Nome | 16 px, `foreground`; baseline ≈ 21 px abaixo do bloco | 15 px; ≈ 18 px abaixo do bloco; 8 px de recuo à esquerda |
| Preço | 18 px (06-033); 29 px abaixo do nome | 16 px; 18 px abaixo do nome |
| RARO | 80×29 na borda esquerda do bloco, topo a 14 px | 68×31 na borda esquerda, topo a 17 px |

## Instruções
1. Props: `nft: NftSummary`, `onAddToCart: (nft: NftSummary) => void`, `onToggleFavorite: (nft: NftSummary) => void`, `updated?: boolean`, `favoriteBusy?: boolean`, `cartBusy?: boolean`, `className?`.
2. Estrutura: `<article className="group relative">` com `data-nft-id={nft.id}`:
   - bloco do card: `div` `relative flex aspect-[43/50] items-center justify-center bg-card max-lg:aspect-[7/8] max-lg:rounded-card`, com a `<img>` (`src`, `alt` = `nft.image.alt`, `width`/`height` 250, `loading="lazy"`, `decoding="async"`, `w-[calc(100%-0.5rem)] aspect-square rounded-media object-cover`), `RarityBadge` (`absolute left-0 top-3.5 max-lg:top-4`) quando `nft.rarity === 'rare'` e `NftCardActions` por cima;
   - texto (`mt-3 max-lg:px-2`): `<h3 className="text-body lg:text-base">` com o `Link` para `/nft/$nftId` (`params={{ nftId: nft.id }}`), texto = `nft.name`, **link esticado**: `after:absolute after:inset-0 after:content-['']` (cobre o `article`; os botões de ação ficam acima com `z-10`); depois `PriceTag` (`price`, `previousPrice`); `PriceChangedNotice kind="updated"` quando `updated` e `kind="sold-out"` quando `nft.soldOut`, em linha com o preço (`flex-wrap`).
3. `data-nft-card-link` no `Link` (o 06-053 usa para devolver o foco ao primeiro card novo). `soldOut = nft.soldOut === true`.
4. Hover/foco: o link esticado mostra o anel de foco no **card inteiro** (`focus-visible:after:ring-2 after:ring-ring`); `NftCardActions` recebe `nftId`, `name`, `isFavorite={nft.isFavorite === true}`, `soldOut`, e chama `onAddToCart(nft)` e `onToggleFavorite(nft)`.
5. Sem cor hexadecimal. Export nomeado.
6. Fechamento: `npx prettier --write src/components/shared/NftCard.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/NftCard.tsx` e `git commit -m "06-037: NftCard"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] O card inteiro (fora das ações) leva a `/nft/<id>`; um único link por card (o "ver" da barra e o nome apontam para o mesmo lugar, mas o nome é o link do card).
- [ ] Medidas conferidas: bloco 258×300 (desktop) e 175×200 (mobile); RARO e preço riscado como nas capturas.
- [ ] Foco por Tab: nome (anel no card) → botões da barra (que aparecem).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** com NFT raro, com preço anterior, esgotado, favoritado e "atualizado", nos dois tamanhos; comparação com as capturas; axe sem violações.
