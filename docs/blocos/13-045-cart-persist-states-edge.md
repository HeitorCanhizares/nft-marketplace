# 13-045 — Carrinho: mescla no login, isolamento no logout e estados da página

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-persist-states-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Persistência e mescla, Estados)

Regras: 13-001.

## Casos
1. Visitante com itens faz login: carrinho mesclado, aviso "Ajustamos … ao estoque disponível" quando reduzido, cupom do visitante mantido.
2. Logout abre um carrinho de visitante novo; troca de usuário não vaza itens; contador do cabeçalho em unidades com anúncio discreto.
3. `server-error:GET /cart` e `network-error`: `ErrorState` com "Tentar novamente"; `slow`: skeleton; `empty-cart`: `EmptyState` "Explorar NFTs"; `session-expired`: fluxo padrão e volta ao carrinho.
4. Erro em recomendações não derruba a página; recomendações sem os NFTs já no carrinho `[d]`; título do documento e foco no `h1` ao entrar em `/carrinho`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
