# 13-026 — Início: catálogo (paginação numérica `[d]` e "Carregar mais" `[m]`)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-catalog-pagination-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-061

Regras: 13-001.

## Casos
1. `[m]` "Carregar mais": acumula até o máximo de 300 (`pageSize`), esconde o botão no fim e **não reseta o scroll para o topo da página**; falha (`server-error:GET /nfts` na 2ª chamada) mostra erro sem perder os 9 cards já carregados, e "Tentar novamente" completa.
2. `[d]` paginação numérica: foco vai ao título do catálogo e **a rolagem posiciona o catálogo `#catalogo` na tela (`window.scrollY > 0`, sem voltar ao topo da página)** depois de trocar de página; "Anterior"/"Próxima" desabilitados nas pontas com `aria-disabled`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
