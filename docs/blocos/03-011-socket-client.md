# 03-011 — Cliente Socket.IO

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Tempo real
**Depende de:** 03-001, 03-007, 03-009

## Objetivo
Criar o cliente do Socket.IO com inscrições, reconexão e invalidação de queries ao reconectar.

## Arquivos
- criar: `src/services/realtime/socket.ts`, `src/services/realtime/events.ts`

## Referências
- docs/api-mock/realtime.md (inscrições, eventos, reconexão)
- src/mocks/realtime/server.ts (o que o servidor simulado entende)

## Instruções
1. `events.ts`: tipos dos eventos do servidor (`nft:price_changed`, `nft:stock_changed`, `order:updated`, `session:expired`) e dos de inscrição (`nft:subscribe`, `nft:unsubscribe`, `order:subscribe`), com os payloads de realtime.md.
2. `socket.ts`: `socket` criado **sem conectar** (`autoConnect: false`), `transports: ['websocket']`, `path: '/socket.io'`, URL de `VITE_SOCKET_URL` (vazia = mesma origem), `auth: (cb) => cb({ token })` lendo o token atual do storage a cada (re)conexão, reconexão automática do Socket.IO ligada.
3. API do módulo: `connectSocket()`, `disconnectSocket()`, `reconnectSocket()` (desconecta e conecta de novo com o token atual; usado no login/logout), `subscribeNfts(ids)` / `unsubscribeNfts(ids)` / `subscribeOrder(orderId)` (guardam o conjunto inscrito e **reenviam** as inscrições a cada `connect`), `clearSubscriptions()` (envia `nft:unsubscribe` do que estava inscrito e esvazia), `onSocketEvent(event, handler): () => void` e `onReconnect(handler): () => void` (dispara quando volta a conectar depois de uma queda; quem chama invalida as queries afetadas).
4. O evento `session:expired` chama `emitSessionExpired()` de `services/http/sessionEvents.ts`.
5. Sem React e sem importar `queryClient`: quem consome decide o que invalidar (fases 06 a 12).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/realtime/socket.ts src/services/realtime/events.ts` e `git commit -m "03-011: cliente Socket.IO"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Nada conecta ao importar o módulo.
- [ ] Inscrições são refeitas depois de reconectar.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 contra o servidor simulado (conexão com token, inscrição, evento, reconexão após `dropConnections`, `session:expired`).
