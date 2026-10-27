# 13-025 — Início: catálogo (as 5 ordenações, abas e filtro de favoritos)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-catalog-sort-tabs-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-061

Regras: 13-001. Usar `recordApi` para confirmar a chave de ordenação e aba enviadas a `GET /api/nfts`.

## Casos
1. As 5 ordenações (Listados recentemente, Menor preço, Maior preço, Mais bem avaliados, Mais favoritados): a ordem dos preços/avaliações dos cards confere e a API recebe a chave certa.
2. Abas: "Novos lançamentos" e "Em alta" combinam com filtros e ordem; a aba ativa está em `aria-selected` e na URL.
3. `/?favoritos=1` logado: só os favoritos (e `pagina` volta a 1); sem favoritos: `EmptyState` com ação; deslogado: vai ao login (A4) com `redirect` e volta já filtrado.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
