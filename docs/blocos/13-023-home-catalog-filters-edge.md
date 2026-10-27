# 13-023 — Início: catálogo (filtros combinados, parâmetros da API, limpar e contagens)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-catalog-filters-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-061, `qualidade/testes.md` (Início)

Regras: 13-001. Usar `recordApi` para ler os parâmetros enviados a `GET /api/nfts`.

## Casos
1. Filtros combinados (coleção + rede + faixa de preço) e **os parâmetros exatos** enviados à API (nomes e valores) conferem com a URL; faixa de preço só vai à API no "Aplicar".
2. Mudar qualquer filtro, ordem ou aba volta à página 1 (`pagina` some da URL) e **não reseta o scroll para o topo da página (`window.scrollY > 0`, catálogo `#catalogo` visível na viewport)**; "Limpar filtros" mantém aba, ordem e `favoritos` e também mantém o scroll no catálogo.
3. Contagens e `facets` do filtro coincidem com os totais do seed (Arte digital 39, Fotografia 14, Música 77, Arte 3D 46, Colecionáveis 27, Generativa 20, Jogos 23, Assinaturas 16, Utilidade 21; Ethereum 119, Polygon 78, Solana 86).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
