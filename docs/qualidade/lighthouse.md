# Lighthouse

Auditoria com `@lhci/cli` (decisão A7) sobre o build de preview, com o MSW ligado (não existe backend).

## Metas

| Categoria | Mínimo |
|---|---|
| Performance | 90 (mobile) |
| Acessibilidade | 100 |
| Boas práticas | 95 |
| SEO | 90 |

Métricas: LCP < 2,5s, CLS < 0,1, INP < 200ms, no perfil mobile do Lighthouse.

## Páginas auditadas

`/`, `/nft/<id do seed>`, `/carrinho`, `/entrar`. Páginas logadas (`/pagamento`, `/perfil/dados`) com script de login do LHCI.

## Cuidados que afetam a nota

- **Latência do mock:** a auditoria roda com latência fixa baixa, para medir o app e não o atraso simulado.
- **MSW e Service Worker:** o worker do MSW é registrado antes do app montar; documentar que a nota inclui o custo dele.
- Imagens dos NFTs em WebP/AVIF, com `width`/`height` (evita CLS), `loading="lazy"` fora da primeira dobra e `fetchpriority="high"` na imagem do hero/LCP.
- Fonte com `font-display: swap` e pré-carregamento do peso principal.
- Divisão de código por rota (o plugin do TanStack Router faz `autoCodeSplitting`).
- Skeletons com as mesmas dimensões do conteúdo final.
- `<title>` e `meta description` por rota.
