# 13-077 — Pagamento: sessão expirada no envio e regras do mock de pedidos

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-001
**Toca:** `tests/e2e/checkout-session-mock-edge.spec.ts` (novo)
**Paralelo:** sim (arquivo próprio).
**Lote:** T6
**Origem:** 11-020 (Sessão expirada, Mock)

Regras: 13-001.

## Casos
1. `session-expired-on-checkout` e expiração por TTL: rascunho salvo (inclui a última digitação), `kurio:checkout` mantido, `/entrar?redirect=/pagamento`; login do **mesmo** usuário restaura formulário, seleção e rede, refaz a cotação e pede reconexão da carteira.
2. Login de **outro** usuário após expiração descarta tudo (`clearPrivateSession`).
3. Regras do mock: `GET /orders` só do usuário e só `pending`; mesma chave com corpo diferente devolve erro; snapshot imutável quando o preço muda; `POST /orders` sem `Idempotency-Key` (chamada direta pelo `window.__kurio.http`).

## Critérios de aceite
- [ ] Spec verde em `desktop` e `mobile`; sem `waitForTimeout`.
