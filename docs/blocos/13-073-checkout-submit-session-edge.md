# 13-073 — Pagamento: envio idempotente, falhas, sessão expirada, mock e acessibilidade

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** 13-001, 13-070
**Toca:** `tests/e2e/checkout-submit-edge.spec.ts` (novo); `tests/e2e/checkout-a11y.spec.ts` (acrescentar; arquivo só deste bloco)
**Paralelo:** sim.
**Lote:** T6
**Origem:** 11-020 (Envio idempotente, Sessão expirada, Mock, Estados e acessibilidade)

Regras: 13-001.

## Envio idempotente e falhas
1. Clique repetido em "Confirmar compra" e em "Confirmar e pagar": **um** pedido (`recordApi` e `ordersStore` com 1 registro).
2. `order-timeout`: "Confirmando seu pedido..." e chega ao pedido **sem duplicar** (o reenvio usa a mesma chave).
3. Falha de rede/5xx: 3 tentativas, depois "Não conseguimos confirmar seu pedido." + "Tentar novamente" reutilizando a chave **sem nova assinatura**.
4. `422 IDEMPOTENCY_KEY_REUSED` e `422 VALIDATION_ERROR` mostram mensagem e mantêm o formulário.
5. `wallet-sign-rejected`: "Pagamento cancelado na carteira", nenhum pedido; desconexão durante a assinatura; refresh no meio do envio recupera o pedido pelo `GET /orders?status=pending`.
6. Em toda falha: carrinho e formulário preservados (conferir `GET /cart`).

## Sessão expirada
7. `session-expired-on-checkout` e expiração por TTL: rascunho salvo (inclui a última digitação), `kurio:checkout` mantido, `/entrar?redirect=/pagamento`; login do **mesmo** usuário restaura formulário, seleção e rede, refaz a cotação e pede reconexão da carteira; **outro** usuário descarta tudo (`clearPrivateSession`).

## Mock
8. `GET /orders` só do usuário e só `pending`; mesma chave com corpo diferente; snapshot imutável quando o preço muda; `POST /orders` sem `Idempotency-Key` (chamada direta pelo `window.__kurio.http`).

## Estados e acessibilidade
9. `slow` (skeleton), `server-error` e rede nos carregamentos; teclado (ordem dos campos, rádios, "⋮", `Dialog`/`Sheet` com foco preso e retorno); anúncios (conexão, mudanças, "Processando..."); `[d]`↔`[m]` no meio do fluxo mantém o estado; 1024 a 1439 px (layout mobile abaixo de 1024, desktop a partir dele); contraste de `muted-foreground` sobre `card`; axe com a revisão aberta e com mudanças.

## Critérios de aceite
- [ ] Specs verdes em `desktop` e `mobile`; nenhum teste deixa pedido duplicado.
