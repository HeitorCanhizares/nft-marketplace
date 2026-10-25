# 02-006 — Cenários ativos e override do localStorage

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Cenários (seleção)
**Depende de:** 02-005

## Objetivo
Decidir quais cenários forçados estão ativos, combinando o ambiente com o override do localStorage (decisão A6).

## Arquivos
- criar: `src/mocks/scenarios/active.ts`

## Referências
- docs/api-mock/cenarios.md#cenários-obrigatórios (lista de nomes) e decisão A6
- docs/api-mock/persistencia.md (`kurio:mock:scenarios`)

## Instruções
1. Exportar `type ScenarioName` com **todos** os nomes de `cenarios.md`: `empty-catalog`, `empty-cart`, `empty-wallets`, `slow`, `jitter`, `offline`, `session-expired`, `forbidden-order`, `email-taken`, `username-taken`, `price-change-on-checkout`, `sold-out-on-checkout`, `coupon-expires-on-checkout`, `fee-change-on-checkout`, `order-timeout`, `payment-slow`, `realtime-drop`, `payment-confirmed`, `payment-declined`, `session-expired-on-checkout`, `wallet-rejected`, `wallet-disconnect`, `wallet-wrong-network`, `wallet-sign-rejected` e os parametrizados `network-error:<rota>`, `server-error:<rota>`, `unavailable:<rota>`, `not-found:<rota>`, `validation-error:<rota>` (`<rota>` = `MÉTODO /caminho`, ex.: `server-error:GET /nfts`).
2. `getActiveScenarios(): string[]`: lê `storage.local` (`kurio:mock:scenarios`, lista separada por vírgula) **a cada chamada** (os testes mudam o valor sem recarregar o módulo). Regra A6: o override só vale quando `import.meta.env.MODE !== 'production'`; em produção usa só `mockConfig.envScenarios`. Valor presente no localStorage (mesmo vazio) **substitui** o do ambiente.
3. `hasScenario(name)` e `routeScenario(kind, routeKey)`: devolve `true` se `${kind}:${routeKey}` está ativo.
4. Nomes desconhecidos: `console.warn` uma vez por nome (typo num teste não deve passar em silêncio).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/scenarios/active.ts` e `git commit -m "02-006: cenários ativos e override A6"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 (override por localStorage antes do `goto`).
