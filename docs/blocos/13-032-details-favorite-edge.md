# 13-032 — Detalhes: favoritar (deslogado, erro, persistência e cache)

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/nft-details-favorite-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Favoritar)

Regras: 13-001.

## Casos
1. Deslogado: `/entrar?redirect=/nft/emerald-ape-042`; depois de **login** e de **cadastro**, volta com o NFT favoritado (ação pendente executada).
2. Erro ao favoritar desfaz e avisa; o favorito persiste a novo login e a refresh; o coração do detalhe e o da Início ficam coerentes (cache invalidado/sincronizado).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
