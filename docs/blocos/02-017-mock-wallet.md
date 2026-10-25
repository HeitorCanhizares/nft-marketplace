# 02-017 — Simulador de carteira

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Carteira simulada
**Depende de:** 02-002, 02-006

## Objetivo
Simular um provedor de carteira (MetaMask, WalletConnect, Coinbase) com atraso, recusa, desconexão, troca de rede e assinatura recusada.

## Arquivos
- criar: `src/mocks/wallet/provider.ts`

## Referências
- docs/api-mock/cenarios.md#carteira-simulada-não-é-http
- docs/arquitetura/estado.md#carteira-serviceswallet

## Instruções
1. Exportar `createMockWalletProvider(): WalletProviderApi` (interface de `src/types/wallet.ts`). Estado interno: conexão atual e assinantes de eventos.
2. `connect(provider, network)`: espera 800–1500 ms (sorteado); cenário `wallet-rejected` → rejeita com `WalletError('USER_REJECTED')`; cenário `wallet-wrong-network` → conecta em **outra** rede que a pedida; padrão: devolve o endereço da carteira cadastrada do usuário atual que corresponde ao provedor (leitura em `walletsStore`, via `kurio:session`); se nenhuma corresponder, um endereço fictício fixo e válido (`0x` + 40 hex).
3. `wallet-disconnect`: alguns segundos (3–6 s) após conectar, emite `disconnect` e zera a conexão.
4. `switchNetwork(network)`: atualiza a rede e emite `chainChanged`.
5. `signOrder(orderRef)`: com `wallet-sign-rejected` rejeita com `WalletError('SIGN_REJECTED')`; senão resolve após 500–1000 ms.
6. `disconnect()` zera a conexão e emite `disconnect`. `on(event, handler)` retorna a função que cancela a inscrição. Todos os `setTimeout` guardados e cancelados no `disconnect()`.
7. Não importar nada de `services/wallet/` (que só nasce na fase 03). O registro do simulador no `main.tsx` também é da fase 03.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/wallet/provider.ts` e `git commit -m "02-017: simulador de carteira"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Cada cenário `wallet-*` tem o comportamento da tabela.
- [ ] Sem timers pendentes após `disconnect()`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 chamando o provedor por `window.__kurioMock` (exposto só em modo de teste pelo 02-020).
