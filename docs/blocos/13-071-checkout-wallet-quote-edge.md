# 13-071 — Pagamento: rede, provedor, carteira simulada, cotação e cupom

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-070
**Toca:** `tests/e2e/checkout-wallet-edge.spec.ts` (novo)
**Paralelo:** sim.
**Lote:** T6
**Origem:** 11-020 (Rede e provedor, Cotação, cupom e tempo real)

Regras: 13-001.

## Rede e provedor
1. Trocar a rede refaz a cotação (Polygon `0.002`, Solana `0.0005`, Ethereum `0.016`); escolher o provedor **sem rede**: aviso "Selecione uma rede antes de escolher a carteira." e não conecta.
2. `wallet-rejected`: "Conexão recusada na carteira" + "Tentar novamente"; nada é enviado.
3. `wallet-disconnect`: na tela e **dentro da revisão** (bloqueia "Confirmar e pagar", pede reconexão, formulário e revisão preservados).
4. `wallet-wrong-network` + "Trocar para…" (`switchNetwork`); "Desconectar" manual; trocar de provedor já conectado.
5. Eventos `accountsChanged` e `chainChanged` (emitidos pelo provedor simulado via `__kurioMock.createMockWalletProvider`/ponte `window.__kurio.wallet`) atualizam o estado e anunciam em `aria-live`.

## Cotação, cupom e tempo real
6. Cotação vence (`VITE_MOCK_QUOTE_TTL_SECONDS` curto, build de teste com o valor em `kurio:mock:*` se o mock permitir, ou `page.clock`) e é refeita sozinha; erro da cotação (`PriceSummary` com "Tentar novamente").
7. `triggerPriceChange` e `triggerStockChange` atualizam a coluna de itens e o total; cupom inválido, expirado e remoção.
8. A **rede única** vale para cotação e conexão: `[d]` campo "Rede" do formulário; `[m]` rede da carteira salva escolhida.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`.
