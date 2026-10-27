# 13-044 — Carrinho: tempo real (`price_changed`, `stock_changed` e reconexão)

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low)
**Depende de:** 13-001
**Toca:** `tests/e2e/cart-live-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T3
**Origem:** 08-015 (Tempo real)

Regras: 13-001.

## Casos
1. `triggerPriceChange` em item do carrinho: "Preço atualizado: de … para … ETH" na linha, cotação refeita, anúncio `polite` agrupado, foco intacto; o aviso fica até o usuário agir na linha.
2. `triggerStockChange`: linha "Esgotado" (fora do total) e "Restam N" com "Ajustar para N"; "Conectar e finalizar"/"Finalizar" bloqueado com o motivo até remover ou ajustar.
3. Evento de NFT que não está no carrinho é ignorado; `dropConnections` invalida `cart` e `quote`; inscrições canceladas ao sair da página.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
