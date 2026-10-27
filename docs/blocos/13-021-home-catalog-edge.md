# 13-021 — Início: casos de borda do catálogo (filtros, URL, histórico, ordenação)

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-catalog-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T1
**Origem:** 06-061, `qualidade/testes.md` (Início)

Regras: 13-001. Usar `recordApi` para ler os parâmetros enviados a `GET /api/nfts`.

## Casos
1. Filtros combinados (coleção + rede + faixa de preço) e **os parâmetros exatos** enviados à API (nomes e valores) conferem com a URL; faixa de preço só vai à API no "Aplicar".
2. Mudar qualquer filtro, ordem ou aba volta à página 1 (`pagina` some da URL); "Limpar filtros" mantém aba, ordem e `favoritos`.
3. Refresh restaura filtros, ordem, aba e página a partir da URL; voltar e avançar do navegador restauram o estado e os cards (cada passo é uma entrada de histórico para filtro, aba, ordem e página; digitação mobile e "Carregar mais" usam `replace`).
4. Parâmetros inválidos na URL (`pagina=0`, `pagina=abc`, `ordem=xyz`, `colecao=inexistente`, `precoMin>precoMax`, página além do total): o app normaliza (valores padrão ou última página) sem erro, e `validateSearch` devolve sempre as chaves.
5. As 5 ordenações (Listados recentemente, Menor preço, Maior preço, Mais bem avaliados, Mais favoritados): a ordem dos preços/avaliações dos cards confere e a API recebe a chave certa.
6. `/?favoritos=1` logado: só os favoritos (e `pagina` volta a 1); sem favoritos: `EmptyState` com ação; deslogado: vai ao login (A4) com `redirect` e volta já filtrado.
7. `[m]` "Carregar mais": acumula até o máximo de 300 (`pageSize`), esconde o botão no fim; falha (`server-error:GET /nfts` na 2ª chamada) mostra erro sem perder os 9 cards já carregados, e "Tentar novamente" completa.
8. `[d]` paginação numérica: foco vai ao título do catálogo depois de trocar de página; "Anterior"/"Próxima" desabilitados nas pontas com `aria-disabled`.
9. Contagens e `facets` do filtro coincidem com os totais do seed (Arte digital 39, Fotografia 14, Música 77, Arte 3D 46, Colecionáveis 27, Generativa 20, Jogos 23, Assinaturas 16, Utilidade 21; Ethereum 119, Polygon 78, Solana 86).
10. Abas: "Novos lançamentos" e "Em alta" combinam com filtros e ordem; a aba ativa está em `aria-selected` e na URL.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
