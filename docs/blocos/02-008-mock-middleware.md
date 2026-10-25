# 02-008 — Middleware de cenários (latência e falhas)

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Cenários (middleware)
**Depende de:** 02-006, 02-007

## Objetivo
Envolver cada resolver do MSW com latência, falhas aleatórias e cenários forçados antes de chamar o handler.

## Arquivos
- criar: `src/mocks/scenarios/latency.ts`, `src/mocks/scenarios/middleware.ts`

## Referências
- docs/api-mock/cenarios.md (variáveis, cenários, regra de `GET /auth/session`)
- docs/arquitetura/estado.md#respostas-fora-de-ordem

## Instruções
1. `latency.ts`: `pickLatencyMs()`: com `slow` ativo sorteia 2000–5000 ms; com `jitter` 0–3000 ms; senão sorteia entre `mockConfig.latency.minMs` e `maxMs` (um valor novo **por requisição**, para gerar respostas fora de ordem). Exportar também `wait(ms)` baseado em `delay` do MSW.
2. `middleware.ts`: exportar `withMock(routeKey, resolver, options?)` onde `routeKey` é `'GET /nfts'` etc. (método e caminho **sem** o prefixo da API) e `options` = `{ protected?: boolean; exemptFromRandomFailures?: boolean }`. Ordem de execução:
   1. aguardar a latência;
   2. `offline` ativo, ou `network-error:<routeKey>` → `networkError()`;
   3. falha aleatória de conexão (`networkErrorRate`) e depois 5xx aleatório (`errorRate`), **nunca** quando `exemptFromRandomFailures` (a ser usado em `GET /auth/session`);
   4. `server-error:<routeKey>` → `apiError('INTERNAL_ERROR')`; `unavailable:<routeKey>` → `SERVICE_UNAVAILABLE`; `not-found:<routeKey>` → `NOT_FOUND`;
   5. rota `protected` com `session-expired` ativo → `SESSION_EXPIRED` (a verificação real do token é de cada handler de fluxo; aqui só o cenário forçado);
   6. `validation-error:<routeKey>` → `422 VALIDATION_ERROR` com `fields` genérico;
   7. senão, chamar o `resolver` original.
3. O middleware **não** conhece recursos: nada de NFT, carrinho ou pedido.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/scenarios/latency.ts src/mocks/scenarios/middleware.ts` e `git commit -m "02-008: middleware de cenários"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Cada requisição sorteia uma latência própria.
- [ ] Falhas aleatórias nunca atingem rotas isentas.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 com o handler de saúde (02-021).
