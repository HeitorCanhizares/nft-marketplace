# 13-022 — Início: casos de borda da busca e do card

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001
**Toca:** `tests/e2e/home-card-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T1
**Origem:** 06-062, 06-063

Regras: 13-001.

## Busca
1. Sem resultados (`q=zzzz`): `EmptyState` com "Limpar filtros"; limpar volta ao catálogo.
2. `[m]` debounce de 300 ms: digitar rápido envia uma única chamada (`recordApi`) com o último valor; `[d]` Enter envia na hora; Esc/Limpar zera `q` e a URL.
3. Espaços e caracteres especiais (`  cosmic  `, `ape & co`, `%`, acentos): `q` é normalizada (`trim`), codificada na URL e a API recebe o valor decodificado.
4. Busca combinada com filtros e ordem; voltar no histórico restaura o campo e os resultados.
5. Resposta antiga não sobrescreve a nova (cancelamento): `delayApi` na 1ª busca; vence a última digitada.

## Card
6. Ações do hover `[d]` aparecem também com foco do teclado (`:focus-within`); o card inteiro é link (`Enter` abre `/nft/$id`); coração e carrinho são botões separados com `aria-label`.
7. Selos: "Esgotado" (NFT sem estoque) e raridade; esgotado sem botão de carrinho ativo (texto, não só cor).
8. Favoritar logado é otimista: `aria-pressed` muda na hora; com `server-error:POST /favorites...` desfaz, avisa (`assertive`) e mantém o foco; clique repetido envia uma só requisição.
9. Favoritar deslogado: vai a `/entrar?redirect=...`; depois do **login** e do **cadastro** volta à Início já com o NFT favoritado (ação pendente).
10. `[d]` carrinho pelo card: adiciona 1 unidade da edição exibida; cliques repetidos viram uma requisição por clique ativo (botão em `aria-busy`); erro 5xx/rede mostra toast e libera o botão; `SOLD_OUT`/`QUANTITY_EXCEEDS_STOCK` (estoque zerado pelo mock antes do clique) mostram a mensagem; contador do cabeçalho em unidades e anúncio `polite`.
11. Visitante adiciona ao carrinho (`X-Cart-Id`), faz login e o contador mostra o carrinho mesclado.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.
