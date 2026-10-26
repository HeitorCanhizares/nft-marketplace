# 08-015 — Casos de borda do carrinho adiados para a fase 13

**Status:** concluído
**Depende de:** 08-014

Lista de testes que **não** são escritos na fase 08 (modo enxuto). O comportamento já está implementado e documentado.

## Quantidade
- "−" desabilitado em 1; "+" desabilitado no limite com "Máximo disponível: N"; edição ABERTA com teto de 99.
- Cliques rápidos agrupados: um só `PATCH` com o valor final (debounce ~400 ms); clique repetido na lixeira e em "Aplicar": uma só requisição.
- `PATCH` com `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK`: desfaz, aviso e dados atualizados; erro 5xx e de rede: desfaz e avisa.
- Decimal, zero e negativo rejeitados pelo mock (`422`).

## Remover e desfazer
- "Desfazer" some em ~6 s; desfazer com estoque menor adiciona o possível e avisa; sem estoque, avisa.
- Foco: lixeira seguinte, anterior (última linha) e título do estado vazio; anúncio "removido".
- Erro ao remover devolve a linha.

## Cupom
- `COUPON_INVALID` e `COUPON_EXPIRED` (`EXPIRADO`): mensagem ligada ao campo e foco no campo; valores sem desconto; `GENESIS5` (5 %).
- Campo vazio só valida no envio; cupom persiste a refresh e segue ao login (cupom do visitante prevalece se o usuário não tinha).
- Cupom que venceu depois de aplicado: cotação com `coupon.status: 'expired'`, sem desconto, aviso no campo.

## Resumo e cotação
- Resumo em estado de atualização (`aria-busy`) enquanto recalcula; erro na cotação mostra "Tentar novamente"; valores idênticos às strings da API para vários carrinhos e redes.
- Esgotado fica fora do subtotal; `insufficient` entra com a quantidade pedida.

## Tempo real
- `nft:price_changed`: "Preço atualizado: de → para ETH" na linha, cotação refeita, anúncio `polite` agrupado, foco intacto.
- `nft:stock_changed`: linha "Esgotado" (fora do total) e "Restam N" com "Ajustar para N"; "Conectar e finalizar" bloqueado com o motivo até remover ou ajustar.
- Evento de NFT fora do carrinho é ignorado; reconexão do socket invalida `cart` e `quote`; inscrições canceladas ao sair da página.

## Persistência e mescla
- Visitante com itens faz login: carrinho mesclado, aviso "Ajustamos … ao estoque disponível" quando reduzido, cupom do visitante mantido.
- Logout abre um carrinho de visitante novo; troca de usuário não vaza itens.
- Carrinho aberto em duas abas coerente após invalidar.

## Estados e acessibilidade
- `500` e erro de rede no carregamento (`ErrorState` com "Tentar novamente"); skeleton com latência alta; `empty-cart` e `session-expired` no carrinho.
- Erro em recomendações sem derrubar a página; recomendações sem os NFTs já no carrinho.
- Teclado: ordem lista → resumo, Enter em "Aplicar", lixeiras e steppers; leitor: anúncios de remoção, cupom e preço.
- Overflow em 320 px e zoom 200 % (painel mobile com cupom, erro e resumo); `prefers-reduced-motion`.
- Título do documento e foco no `h1` ao navegar para `/carrinho`.
- Contador do cabeçalho em unidades e anúncio discreto ao mudar.
