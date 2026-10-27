# 13-040 — Carrinho: quantidade, remover e desfazer

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-010, 13-011
**Toca:** `tests/e2e/cart-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T3
**Origem:** 08-015 (Quantidade, Remover e desfazer), `testes.md` (Carrinho)

Regras: 13-001. Carrinho de partida: `seedFigmaCart` (Emerald Ape ×2, Violet Nomad, Ivory Baron).

## Quantidade
1. "−" desabilitado em 1; "+" desabilitado no limite com "Máximo disponível: N"; edição ABERTA com teto de 99.
2. Cliques rápidos viram **um** `PATCH` com o valor final (debounce ~400 ms, `recordApi`); clique repetido na lixeira e em "Aplicar": uma requisição.
3. `PATCH` com `SOLD_OUT` e `QUANTITY_EXCEEDS_STOCK`: valor desfeito, aviso e dados atualizados; 5xx e rede: desfaz e avisa.
4. Decimal, zero e negativo rejeitados pelo mock (`422`, chamada direta pelo `window.__kurio.http`).
5. A quantidade é otimista só em `quantity`/`itemCount`; os valores monetários ficam `aria-busy` até a resposta.

## Remover e desfazer
6. "Desfazer" some em ~6 s (`page.clock`); desfazer devolve a linha ao **fim** da lista; com estoque menor adiciona o possível e avisa; sem estoque, avisa.
7. Foco depois de remover: lixeira seguinte; última linha → lixeira anterior; carrinho vazio → título do `EmptyState`; anúncio "removido" (`polite`).
8. Erro ao remover (`server-error:DELETE /cart/items/...`) devolve a linha e avisa.
9. Carrinho persiste após refresh; abas: carrinho aberto em duas páginas do mesmo contexto fica coerente depois de invalidar.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.
