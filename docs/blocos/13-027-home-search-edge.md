# 13-027 — Início: busca (vazio, debounce/Enter/Esc, normalização e cancelamento)

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/home-search-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T1
**Origem:** 06-062

Regras: 13-001.

## Casos
1. Sem resultados (`q=zzzz`): `EmptyState` com "Limpar filtros"; limpar volta ao catálogo.
2. `[m]` debounce de 300 ms: digitar rápido envia uma única chamada (`recordApi`) com o último valor; `[d]` Enter envia na hora; Esc/Limpar zera `q` e a URL.
3. Espaços e caracteres especiais (`  cosmic  `, `ape & co`, `%`, acentos): `q` é normalizada (`trim`), codificada na URL e a API recebe o valor decodificado; busca combinada com filtros e ordem; voltar no histórico restaura o campo e os resultados.
4. Resposta antiga não sobrescreve a nova (cancelamento): `delayApi` na 1ª busca; vence a última digitada.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
