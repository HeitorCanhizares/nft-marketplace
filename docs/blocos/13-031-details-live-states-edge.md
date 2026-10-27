# 13-031 — Detalhes: tempo real, estados, galeria e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-030
**Toca:** `tests/e2e/nft-details-states-edge.spec.ts` (novo); `tests/e2e/nft-details-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T2
**Origem:** 07-018 (Tempo real, Estados, Interação e acessibilidade)

Regras: 13-001.

## Tempo real
1. `triggerPriceChange` no NFT aberto: preço novo, selo "Atualizado" por 5 s (`page.clock`), aviso `polite`; o foco não se move.
2. `triggerStockChange`: edição selecionada esgota → pílula "Esgotado", limite do stepper cai, **quantidade ajustada com aviso**, troca automática para a primeira edição disponível; NFT todo esgotado desabilita "COMPRAR".
3. `dropConnections` (reconexão) relê o detalhe.

## Estados
4. `server-error:GET /nfts/:id`, `network-error` e `offline`: `RouteError` com "Tentar novamente"; `slow`: skeleton; `not-found`: "NFT não encontrado" com título "NFT não encontrado | Kurio".
5. Erro em avaliações (`server-error:GET /nfts/:id/reviews`) e em relacionados não derruba a página; avaliações vazias mostram "Sem avaliações"; `page` inválida na URL normaliza.
6. `session-expired` ao favoritar ou comprar: fluxo padrão de expiração e volta ao detalhe.
7. Título do documento "<nome> | Kurio"; o foco vai ao `h1` ao navegar de um NFT relacionado para outro; breadcrumb "Início" e "Mercado" `[d]`.

## Galeria e links
8. Zoom em tela cheia: setas e ← → nas pontas (sem laço ou com laço, conforme o componente), Esc fecha e o foco volta ao gatilho; `[m]` swipe real troca a imagem.
9. Links de compartilhar: `target="_blank"`, `rel` com `noopener`, texto "(abre em nova aba)"; a URL compartilhada contém só o NFT.
10. Tabs (Rede/Contrato/Direitos...) e grupo de edições por teclado; `prefers-reduced-motion` sem rolagem suave até as abas.

## Acessibilidade
11. Axe com: zoom aberto, drawer de avaliações `[m]`, NFT esgotado, 404, erro. Anúncio "Adicionado ao carrinho".

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`.
