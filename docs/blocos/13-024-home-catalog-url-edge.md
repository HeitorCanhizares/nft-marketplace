# 13-024 — Início: catálogo (persistência na URL, histórico e normalização de parâmetros)

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/home-catalog-url-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-061, `qualidade/testes.md` (Início)

Regras: 13-001.

## Casos
1. Refresh restaura filtros, ordem, aba e página a partir da URL; voltar e avançar do navegador restauram o estado e os cards (cada passo é uma entrada de histórico para filtro, aba, ordem e página; digitação mobile e "Carregar mais" usam `replace`).
2. Parâmetros inválidos na URL (`pagina=0`, `pagina=abc`, `ordem=xyz`, `colecao=inexistente`, `precoMin>precoMax`, página além do total): o app normaliza (valores padrão ou última página) sem erro, e `validateSearch` devolve sempre as chaves.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
