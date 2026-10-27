# 13-092 — Matriz de cobertura: `testes.md` e `cenarios.md` contra os testes

**Status:** pendente
**Responsável:** Sonnet
**Depende de:** todos os blocos de teste (13-020 a 13-082)
**Toca:** — (relatório ao Opus; os ajustes vão para os specs dos blocos de origem)
**Paralelo:** não.
**Lote:** —

## Objetivo
Garantir que **cada linha** da tabela de `qualidade/testes.md` e **cada cenário** de `api-mock/cenarios.md` (incluindo a carteira simulada) tem pelo menos um teste E2E passando.

## Instruções
1. Montar a matriz "linha ou cenário → arquivo › nome do teste". Cenários: `empty-catalog`, `empty-cart`, `empty-wallets`, `slow`, `jitter`, `offline`, `network-error:<rota>`, `server-error:<rota>`, `unavailable:<rota>`, `not-found:<rota>`, `session-expired`, `forbidden-order`, `email-taken`, `username-taken`, `validation-error:<rota>`, cupom inválido/expirado, `price-change-on-checkout`, `sold-out-on-checkout`, `coupon-expires-on-checkout`, `fee-change-on-checkout`, cliques repetidos, `order-timeout`, `payment-slow`, `realtime-drop`, `payment-confirmed`, `payment-declined`, `session-expired-on-checkout`, `wallet-rejected`, `wallet-disconnect`, `wallet-wrong-network`, `wallet-sign-rejected`, e a carteira padrão.
2. Linhas da tabela de `testes.md` já cobertas na fase 05 (Login/Cadastro, rotas protegidas, troca de usuário em `session.spec.ts`): só apontar o teste existente.
3. Lacuna encontrada → teste no spec do fluxo (não criar spec novo sem necessidade).
4. Conferir que **não há** `waitForTimeout`, `test.skip` ou `test.fixme` sem comentário (`grep`).

## Critérios de aceite
- [ ] Matriz sem lacunas, entregue ao Opus (o Opus decide se ela entra em `qualidade/testes.md`).
