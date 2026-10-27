# 12-016 — Ajuste do teste do Pagamento (o pedido agora sai de `pending`)

**Status:** pendente
**Fluxo / subitem:** Confirmação › 2 (efeito colateral do ciclo de vida sobre a fase 11)
**Depende de:** 12-003
**Toca:** `tests/e2e/checkout.spec.ts` (alterar)
**Paralelo:** pode rodar com os lotes E e F (arquivos distintos). Só `checkout.spec.ts` é tocado; o lote K não mexe nele.
**Lote:** J

## Objetivo
Na fase 11 o pedido ficava `pending` para sempre. Com o ciclo de vida do 12-002/12-003 ele confirma em 3 s, e o teste que volta ao `/pagamento` esperando a recuperação do pedido pendente passa a depender de tempo. Tornar isso determinístico.

## Arquivos (testes)
- alterar: `tests/e2e/checkout.spec.ts`

## Referências
- `tests/e2e/checkout.spec.ts` (teste "desktop: fluxo completo até o pedido": o trecho "Pedido pendente: voltar ao pagamento leva de novo ao pedido"); docs/api-mock/cenarios.md (`payment-slow`: o pedido fica `pending` por 30 s)
- Decisão A6: `localStorage['kurio:mock:scenarios']` sobrescreve o cenário e é lido a cada chamada do mock

## Instruções
1. No teste "desktop: fluxo completo até o pedido", **antes** de clicar em "Confirmar e pagar", gravar o cenário: `await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', 'payment-slow')`)`. O pedido fica `pending` por 30 s, então `page.goto('/pagamento')` (que recarrega o app) continua levando de volta ao pedido, sem corrida com o timer de 3 s.
2. Os testes "outra carteira salva como secundária" e "mobile: carteira salva…" **não mudam** (terminam na URL `/pedido/<id>` e no `GET /wallets`; o desfecho do pedido não importa para eles).
3. Rodar e conferir que continuam verdes, sem tocar em mais nada: `npm run test:e2e -- checkout checkout-a11y layout protected-routes mock-base app-base` (o `layout.spec` abre `/pedido/x` logado: a página agora faz o `GET` e mostra "Pedido não encontrado"; o teste só confere o item ativo do cabeçalho). Se algum falhar por causa do pedido que agora confirma ou da página real, **parar e avisar**, não afrouxar o teste.
4. Commit: `git commit -m "12-016: checkout.spec com payment-slow" -- tests/e2e/checkout.spec.ts`.

## Critérios de aceite
- [ ] O teste do fluxo completo não depende mais do relógio (sem `waitForTimeout`).
- [ ] Os 6 specs acima passam nos dois projetos.

## Verificação (Sonnet)
- Os specs acima, uma vez.
