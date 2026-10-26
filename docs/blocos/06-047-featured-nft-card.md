# 06-047 — `FeaturedNftCard`

**Status:** pendente
**Fluxo / subitem:** Início › 2 (NFT em destaque, só no desktop; clicar abre o detalhe)
**Depende de:** 01-015, 06-001
**Depende de decisão:** pergunta 7 do relatório da fase 06 (qual NFT é o destaque)

## Objetivo
Criar o cartão "NFT EM DESTAQUE / OFERTA LIMITADA" da coluna lateral da Início e o esqueleto dele.

## Arquivos
- criar: `src/components/shared/FeaturedNftCard.tsx`
- criar: `src/components/shared/FeaturedNftCardSkeleton.tsx`

## Referências
- docs/fluxos/inicio.md (subitem 2) e docs/design/componentes.md (`FeaturedNftCard`)
- Captura 1:1 `desktop-inicio.png`: cartão **310×469 px** (x 120–429, y 1456–1925); cabeçalho `bg-card` com "NFT EM DESTAQUE" em `primary`, **24 px** negrito, alinhado à esquerda (x 140, recuo 20), centro em y 1497; "OFERTA LIMITADA" em `foreground`, **22 px** (`text-featured`) negrito, **centralizado**, centro em y 1537; a imagem tem **310×366 px** (y 1560–1925), raio 24 (`rounded-panel`) em todos os cantos

## Instruções
1. Props: `nft: NftSummary`, `className?`. O cartão inteiro é **um `Link`** para `/nft/$nftId` (`params={{ nftId: nft.id }}`); dentro: `<div>` com o cabeçalho (os dois textos) e a `<img>` (`alt` = `nft.image.alt`, `loading="lazy"`, `w-full object-cover rounded-panel`, proporção 310:366).
2. Nome acessível do link: o texto visível + `<span className="sr-only">: {nft.name}</span>` ("NFT EM DESTAQUE OFERTA LIMITADA: Cosmic Bloom #118"). Os dois textos são `<p>` (o `h2` de cada seção é do catálogo; este cartão não vira heading).
3. Foco: anel padrão no cartão inteiro (`focus-visible:ring-2`); hover: nada além de `hover:opacity-95`.
4. `FeaturedNftCardSkeleton`: mesma caixa 310×469 com `Skeleton`s; `role="status"` + sr-only "Carregando destaque…".
5. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/shared/FeaturedNftCard.tsx src/components/shared/FeaturedNftCardSkeleton.tsx` e `git commit -m "06-047: FeaturedNftCard"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; sem cor hexadecimal, `oklch()` ou `rgb()`.
- [ ] 310×469 px; textos e posições como na captura (tolerância de 4 px); o cartão leva a `/nft/<id>`.
- [ ] O texto "OFERTA LIMITADA" tem contraste ≥ 4,5:1 sobre o fundo.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Probe **não commitado** em 1440×900; comparado com a captura; axe.
