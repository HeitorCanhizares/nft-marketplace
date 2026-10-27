# 13-041 — Carrinho: remover, desfazer (6 s), foco pós-remoção e persistência

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-remove-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Remover e desfazer)

Regras: 13-001.

## Casos
1. "Desfazer" some em ~6 s (`page.clock`); desfazer devolve a linha ao **fim** da lista; com estoque menor adiciona o possível e avisa; sem estoque, avisa.
2. Foco depois de remover: lixeira seguinte; última linha → lixeira anterior; carrinho vazio → título do `EmptyState`; anúncio "removido" (`polite`).
3. Erro ao remover (`server-error:DELETE /cart/items/...`) devolve a linha e avisa.
4. Carrinho persiste após refresh; abas: carrinho aberto em duas páginas do mesmo contexto fica coerente depois de invalidar.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
