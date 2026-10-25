# 02-018 — Servidor de tempo real simulado

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Tempo real
**Depende de:** 02-006, 02-010

## Objetivo
Simular o servidor Socket.IO com o MSW: conexão, inscrições e emissão de eventos.

## Arquivos
- criar: `src/mocks/realtime/server.ts`

## Referências
- docs/api-mock/realtime.md
- Dependência `@mswjs/socket.io-binding` (A7), já instalada; ler a documentação do pacote antes de usar

## Instruções
1. Criar o handler WebSocket do MSW (`ws.link`) para o caminho `/socket.io` e adaptá-lo com `@mswjs/socket.io-binding`. Só funciona com `transports: ['websocket']` (documentado em realtime.md).
2. Aceitar `nft:subscribe`/`nft:unsubscribe` (`{ ids }`) e `order:subscribe` (`{ orderId }`), mantendo as inscrições por conexão.
3. Exportar `emitToNftSubscribers(event, payload)` e `emitOrderUpdated(orderId, payload)`, que emitem `nft:price_changed`, `nft:stock_changed`, `order:updated` e `session:expired` com os payloads de realtime.md, **só** para quem está inscrito.
4. Cenário `realtime-drop`: exportar `dropConnections(forMs)` que derruba as conexões e só aceita novas após `forMs` (para o polling assumir).
5. Quando `mockConfig.realtimeEnabled` for `false`, o handler aceita a conexão mas nunca emite nada.
6. Exportar `realtimeHandlers` para o `browser.ts` (02-020).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/realtime/server.ts` e `git commit -m "02-018: servidor de tempo real simulado"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Evento só chega a quem está inscrito.
- [ ] Nenhum evento com `VITE_MOCK_REALTIME=disabled`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 02-022 com o cliente `socket.io-client` UMD carregado na página de teste.
- Se o binding não suportar algo (ex.: `transports`), o Haiku para e relata: a decisão é do usuário.
