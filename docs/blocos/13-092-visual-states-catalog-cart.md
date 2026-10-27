# 13-092 — Baselines visuais de estados não desenhados: Início, Detalhes e Carrinho

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) (baselines aprovadas pelo usuário)
**Depende de:** 13-010, 13-011, 13-014, 13-015, 13-016 e dos specs de borda T1–T3
**Toca:** `tests/visual/states-catalog-cart.spec.ts` (novo) e a pasta de snapshots dele
**Paralelo:** sim com 13-093 (arquivos distintos).
**Lote:** T8
**Origem:** 06-067

Regras: 13-001; padrão de `tests/visual/*.spec.ts` (`SHOT`, `settle`, movimento reduzido, imagens carregadas, `maxDiffPixelRatio` ≤ 0,01). Só Chromium (`desktop` e `mobile`).

## Estados (uma captura por estado e por projeto)
1. Início: vazio (`empty-catalog`), erro (`server-error:GET /nfts`), carregando (`slow`, esqueletos), drawer de filtros aberto `[m]`, favoritos vazio, 320 px `[m]`.
2. Detalhes: NFT esgotado, 404, erro.
3. Carrinho: vazio, com item esgotado e aviso de preço, erro.

## Critérios de aceite
- [ ] `npx playwright test tests/visual/states-catalog-cart.spec.ts --update-snapshots` gera as baselines; segunda execução sem diferença.
- [ ] **O usuário aprova as baselines**.
