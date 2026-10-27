# 13-094 — Matriz de cobertura (`testes.md` e `cenarios.md`) e varredura das regras de código

**Status:** pendente
**Responsável:** Claude Sonnet 5.5 (effort: low) · fallback: Gemini 3.8 Flash (effort: high)
**Depende de:** 13-020 a 13-091
**Toca:** — (relatório ao Opus; lacunas viram testes nos specs de origem; violações de código viram blocos `13-1NN` para o Haiku)
**Paralelo:** não.
**Lote:** —
**Origem:** 13-092 e 13-093 originais

## Parte 1 — Matriz de cobertura
1. Montar a matriz "linha ou cenário → arquivo › nome do teste" cobrindo todas as linhas de `qualidade/testes.md` e todos os cenários de `api-mock/cenarios.md` (`empty-catalog`, `empty-cart`, `empty-wallets`, `slow`, `jitter`, `offline`, `network-error:<rota>`, `server-error:<rota>`, `unavailable:<rota>`, `not-found:<rota>`, `session-expired`, `forbidden-order`, `email-taken`, `username-taken`, `validation-error:<rota>`, cupom inválido/expirado, `price-change-on-checkout`, `sold-out-on-checkout`, `coupon-expires-on-checkout`, `fee-change-on-checkout`, cliques repetidos, `order-timeout`, `payment-slow`, `realtime-drop`, `payment-confirmed`, `payment-declined`, `session-expired-on-checkout`, `wallet-rejected`, `wallet-disconnect`, `wallet-wrong-network`, `wallet-sign-rejected` e carteira padrão).
2. Conferir que **não há** `waitForTimeout`, `test.skip` ou `test.fixme` sem comentário (`grep`).

## Parte 2 — Varredura das regras de código
3. Sem `eslint-disable` fora de `src/components/ui/**`, sem `@ts-ignore`/`@ts-expect-error`, sem `any`, sem asserções `as X` (exceto `as const`) e sem `!` não nulo em `src/` e `tests/`.
4. Sem cor literal (`#`, `rgb(`, `hsl(`, `oklch(` fora de `globals.css`); camadas de `arquitetura/pastas.md` respeitadas; `useAuth` sempre de `@/contexts/auth`; ETH como string decimal.
5. **Build de produção** (`npm run build`): `dist/` não contém `__kurio` nem `__kurioMock`. Cada tela tem `<title>` próprio, `meta description`, `<html lang="pt-BR">`, um `h1`.

## Critérios de aceite
- [ ] Matriz sem lacunas e relatório com 0 violações entregues ao Opus.
