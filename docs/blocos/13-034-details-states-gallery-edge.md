# 13-034 — Detalhes: estados, avaliações, galeria/zoom e compartilhamento

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/nft-details-states-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Estados, Interação)

Regras: 13-001.

## Casos
1. `server-error:GET /nfts/:id`, `network-error` e `offline`: `RouteError` com "Tentar novamente"; `slow`: skeleton; `not-found`: "NFT não encontrado" com título "NFT não encontrado | Kurio". Título do documento "<nome> | Kurio"; foco no `h1` ao navegar de um NFT relacionado para outro; breadcrumb "Início" e "Mercado" `[d]`.
2. Erro em avaliações (`server-error:GET /nfts/:id/reviews`) e em relacionados não derruba a página; avaliações vazias mostram "Sem avaliações"; `page` inválida na URL normaliza; `session-expired` ao favoritar ou comprar leva ao login e volta ao detalhe.
3. Zoom em tela cheia e miniaturas: as 4 miniaturas repetem a mesma foto (`src`) do próprio NFT clicado; setas e limites nas pontas atualizam o contador (`Imagem X de 4`), Esc fecha e o foco volta ao gatilho; `[m]` swipe real avança o slide do carrossel.
4. Links de compartilhar (`target="_blank"`, `rel` com `noopener`, texto "(abre em nova aba)", URL compartilhada contém só o NFT); Tabs (Rede/Contrato/Direitos...) e grupo de edições por teclado; `prefers-reduced-motion` sem rolagem suave até as abas.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
