# 13-042 — Carrinho: tempo real, mescla, estados e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-040
**Toca:** `tests/e2e/cart-live-edge.spec.ts` (novo); `tests/e2e/cart-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T3
**Origem:** 08-015 (Tempo real, Persistência e mescla, Estados e acessibilidade)

Regras: 13-001.

## Tempo real
1. `triggerPriceChange` em item do carrinho: "Preço atualizado: de → para ETH" na linha, cotação refeita, anúncio `polite` agrupado, foco intacto; o aviso fica até o usuário agir na linha.
2. `triggerStockChange`: linha "Esgotado" (fora do total) e "Restam N" com "Ajustar para N"; "Conectar e finalizar"/"Finalizar" bloqueado com o motivo até remover ou ajustar.
3. Evento de NFT que não está no carrinho é ignorado; `dropConnections` invalida `cart` e `quote`; inscrições canceladas ao sair da página.

## Persistência e mescla
4. Visitante com itens faz login: carrinho mesclado, aviso "Ajustamos … ao estoque disponível" quando reduzido, cupom do visitante mantido.
5. Logout abre um carrinho de visitante novo; troca de usuário não vaza itens; contador do cabeçalho em unidades com anúncio discreto.

## Estados
6. `server-error:GET /cart` e `network-error`: `ErrorState` com "Tentar novamente"; `slow`: skeleton; `empty-cart`: `EmptyState` "Explorar NFTs"; `session-expired`: fluxo padrão e volta ao carrinho.
7. Erro em recomendações não derruba a página; recomendações sem os NFTs já no carrinho `[d]`.
8. Título do documento e foco no `h1` ao entrar em `/carrinho`.

## Acessibilidade
9. Axe: carrinho com aviso de preço, com item esgotado, vazio, erro. Teclado: ordem lista → resumo, Enter em "Aplicar", lixeiras e steppers; leitor: anúncios de remoção, cupom e preço.
10. Overflow/zoom: 13-090; aqui só o painel mobile com cupom, erro e resumo ao mesmo tempo em 320 px.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`.
