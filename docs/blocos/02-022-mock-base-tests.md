# 02-022 — Testes da base do mock

**Status:** pendente
**Responsável:** Sonnet
**Fluxo / subitem:** Fase 02 › Testes
**Depende de:** 02-001 a 02-021

## Objetivo
Provar a base do mock com Playwright (desktop e mobile), incluindo as pendências herdadas da fase 00.

## Arquivos
- criar: `tests/e2e/mock-base.spec.ts`, `tests/e2e/fixtures.ts` (credenciais fictícias de teste, só para os testes)

## Referências
- docs/qualidade/testes.md
- Pendência da fase 00: confirmar que o modo `test` carrega o `.env.test`
- Decisão do usuário: tempo real ligado, sem oscilação aleatória em teste

## Instruções
O Sonnet escreve, com `getByRole`/`page.evaluate` (strings, sem tipos DOM) e **sem** `data-testid`:
1. **`.env.test` carregado**: `GET /api/health` responde em ≈ 50 ms (latência fixa) em 5 chamadas; o mesmo build com `kurio:mock:scenarios=slow` demora ≥ 2 s.
2. **Worker ativo** antes do app (navigator.serviceWorker.controller não nulo após o `goto`).
3. **Override A6**: `offline` → `fetch` rejeita; `server-error:GET /health` → `500` com corpo `error.code = INTERNAL_ERROR`; `unavailable:GET /health` → 503; `not-found:GET /health` → 404; sem cenário → 200.
4. **Seed**: `kurio-mock-db` com as 13 stores; `nfts` = 283; contagens por rede 119/78/86 e por coleção do 02-012; 2 usuários e 1 carteira principal; cupons.
5. **Persistência**: gravar um registro, recarregar a página: continua lá (sem reset). `VITE_MOCK_SEED_RESET=true` no `.env.test` zera o banco a cada novo contexto de navegador (cada teste começa limpo).
6. **Hash de senha**: `users` não contém texto da senha; `verifyPassword` certo/errado via `__kurioMock`.
7. **Snapshot do pedido**: gravar um pedido, regravar com `total` diferente: o valor original permanece.
8. **Carteira simulada** via `__kurioMock.createMockWalletProvider()`: conexão (800–1500 ms, endereço do usuário), `wallet-rejected`, `wallet-wrong-network`, `wallet-disconnect`, `wallet-sign-rejected`.
9. **Tempo real**: carregar o cliente UMD de `socket.io-client` (`node_modules/socket.io-client/dist/socket.io.min.js`), conectar com `transports: ['websocket']`, inscrever em um NFT, chamar `triggerPriceChange` e receber `nft:price_changed`; **sem** inscrição, não recebe; **sem oscilação aleatória** em 60 s de espera curta (verificar por 3 s e declarar a regra em `MODE === 'test'`); `dropConnections` derruba e reconecta.
10. **Storage seguro**: com `Storage.prototype.setItem` lançando, a página carrega.
Credenciais: o Sonnet copia as senhas fictícias informadas pelo Haiku no 02-012 para `fixtures.ts` (única cópia em texto).
Commit: `git add tests/e2e/mock-base.spec.ts tests/e2e/fixtures.ts` e `git commit -m "02-022: testes da base do mock"`.

## Critérios de aceite
- [ ] Todos os testes passam nos projetos `desktop` e `mobile`, duas execuções seguidas.
- [ ] Nenhum `data-testid`.

## Verificação (Sonnet)
- `npm run test:e2e` → todos passando; lint, format, typecheck e build → exit 0.
