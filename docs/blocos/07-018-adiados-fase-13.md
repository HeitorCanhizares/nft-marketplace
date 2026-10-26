# 07-018 — Casos de borda do detalhe adiados para a fase 13

**Status:** pendente (executado só na fase 13)
**Depende de:** 07-017

Lista de testes que **não** são escritos na fase 07 (modo enxuto). O comportamento já está implementado e documentado.

## Quantidade e edição
- Stepper respeita estoque menos o que já está no carrinho; texto "N já no seu carrinho" e "Máximo disponível: N"; "+" desabilitado no limite.
- ABERTA: teto de 99. Estoque 1 (edição 1/1).
- Edição esgotada: pílula desabilitada com "Esgotado"; NFT todo esgotado: "COMPRAR" desabilitado.
- Trocar de edição volta a quantidade para 1.
- Tudo já no carrinho: "COMPRAR" só navega ao carrinho; botão de carrinho desabilitado.

## Comprar e carrinho
- `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK`: mensagem junto ao stepper e dados atualizados.
- Erro 5xx e erro de rede ao adicionar: toast e botões liberados.
- Clique repetido em COMPRAR, no carrinho e em favoritar: uma só requisição.
- Visitante adiciona (X-Cart-Id) e o carrinho é mesclado no login.
- Soma ao mesmo NFT e edição já no carrinho.

## Favoritar
- Sem login: `/entrar?redirect=` e ação concluída na volta (login e cadastro).
- Erro ao favoritar: desfaz e avisa; favorito persiste a novo login.

## Tempo real
- `nft:price_changed`: preço novo, selo "Atualizado" e aviso `polite`.
- `nft:stock_changed`: pílula esgotada, limite do stepper, quantidade ajustada com aviso, troca automática de edição.
- Reconexão do socket invalida o detalhe.

## Estados
- `500` e erro de rede no carregamento (`RouteError` com "Tentar novamente"); skeleton com latência alta.
- Erro em avaliações e em relacionados sem derrubar a página; avaliações vazias; `page` inválida.
- Cenário `session-expired` no detalhe.
- Título do documento no detalhe e no 404; foco no `h1` ao navegar.

## Interação e acessibilidade
- Zoom: setas e ← → nas pontas, foco devolvido ao gatilho; swipe real no mobile.
- Teclado nas abas, no grupo de edições e no carrossel; leitor: anúncios de "Adicionado ao carrinho".
- Overflow em 320 px e zoom 200 %; `prefers-reduced-motion` no scroll até as abas.
- Links de compartilhar: `rel`/`target` e texto "(abre em nova aba)"; URL só com o NFT.
- Breadcrumb: links "Início" e "Mercado".
