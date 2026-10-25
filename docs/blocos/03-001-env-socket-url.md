# 03-001 — Variável VITE_SOCKET_URL

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Ambiente
**Depende de:** Fase 02

## Objetivo
Acrescentar a variável opcional da URL do Socket.IO aos `.env` e à tipagem.

## Arquivos
- alterar: `.env`, `src/vite-env.d.ts`

## Referências
- docs/api-mock/realtime.md (`VITE_SOCKET_URL`: padrão mesma origem, caminho `/socket.io`)
- docs/api-mock/cenarios.md (tabela de variáveis, já atualizada)

## Instruções
1. `.env`: `VITE_SOCKET_URL=` (vazio = mesma origem), com uma linha de comentário. Os demais `.env.*` herdam.
2. `src/vite-env.d.ts`: `readonly VITE_SOCKET_URL: string` em `ImportMetaEnv`.
3. Não alterar o servidor simulado (ele já escuta o caminho `/socket.io/` em qualquer host).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add .env src/vite-env.d.ts` e `git commit -m "03-001: VITE_SOCKET_URL"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] `.env` e a tipagem concordam (14 variáveis `VITE_*`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.

