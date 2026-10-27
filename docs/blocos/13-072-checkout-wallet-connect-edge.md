# 13-072 — Pagamento: conexão da carteira simulada, erros e eventos

**Status:** concluído
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001, 13-010
**Toca:** `tests/e2e/checkout-wallet-connect-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Rede e provedor)

Regras: 13-001.

## Casos
1. Trocar a rede refaz a cotação (Polygon `0.002`, Solana `0.0005`, Ethereum `0.016`); escolher o provedor **sem rede**: aviso "Selecione uma rede antes de escolher a carteira." e não conecta.
2. `wallet-rejected`: "Conexão recusada na carteira" + "Tentar novamente"; nada é enviado. `wallet-disconnect`: na tela e **dentro da revisão** (bloqueia "Confirmar e pagar", pede reconexão, formulário e revisão preservados).
3. `wallet-wrong-network` + "Trocar para…" (`switchNetwork`); "Desconectar" manual; trocar de provedor já conectado.
4. Eventos `accountsChanged` e `chainChanged` (emitidos pelo provedor simulado via `__kurioMock.createMockWalletProvider`/ponte `window.__kurio.wallet`) atualizam o estado e anunciam em `aria-live`.

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
