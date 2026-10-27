# 13-033 — Detalhes: tempo real (`price_changed`, `stock_changed` e reconexão)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/nft-details-live-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T2
**Origem:** 07-018 (Tempo real)

Regras: 13-001.

## Casos
1. `triggerPriceChange` no NFT aberto: preço novo, selo "Atualizado" por 5 s (`page.clock`), aviso `polite`; o foco não se move.
2. `triggerStockChange`: edição selecionada esgota → pílula "Esgotado", limite do stepper cai, **quantidade ajustada com aviso**, troca automática para a primeira edição disponível; NFT todo esgotado desabilita "COMPRAR".
3. `dropConnections` (reconexão) relê o detalhe.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
