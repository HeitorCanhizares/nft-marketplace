# 06-061 — Testes do catálogo

**Status:** concluído
**Responsável:** Sonnet

> **Modo enxuto** (docs/decisoes.md): só o caminho principal. 

## Adiado para a fase 13
- Filtros combinados e preço, volta à página 1 ao filtrar, refresh e histórico (voltar/avançar), parâmetros inválidos na URL, os parâmetros exatos enviados a `GET /api/nfts` (`recordApi`), "Carregar mais" com falha, foco após troca de página, as 5 ordenações, `/?favoritos=1`.

## Escopo enxuto (`tests/e2e/home.spec.ts`)
- Desktop: filtrar por coleção e por rede, ordenar por "Menor preço", "Limpar filtros", paginar (`pagina=2`), abrir a aba "Em alta", tudo com a URL atualizada.
- Mobile: "Carregar mais" (9 para 18 cards), drawer de filtros (rede + "Ver N resultados"), aba "Novos lançamentos".
