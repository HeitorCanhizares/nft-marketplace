# 00-011 — Instalar MSW, Socket.IO e idb

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Dependências da stack e A7 (mock e tempo real)
**Depende de:** 00-010

## Objetivo
Instalar o que a fase 02 usará para a API simulada, a persistência e o tempo real.

## Arquivos
- nenhum arquivo de código; só `package.json` e `package-lock.json`

## Referências
- docs/decisoes.md (A7: `idb`, `@mswjs/socket.io-binding`)
- docs/api-mock/realtime.md, docs/api-mock/persistencia.md

## Instruções
1. `npm install socket.io-client idb`.
2. `npm install -D msw @mswjs/socket.io-binding`.
3. Conferir os `peerDependencies` de `@mswjs/socket.io-binding`. Se exigir pacote que **não** está na lista aprovada (ex.: `@mswjs/interceptors`) ou versão de `msw` diferente da instalada, **parar e perguntar ao usuário**.
4. **Não** rodar `npx msw init` (gerar `public/mockServiceWorker.js` é da fase 02) e não criar nada em `src/mocks/`.
5. Commit: `git add package.json package-lock.json` e `git commit -m "00-011: instala MSW, Socket.IO e idb"`.

## Critérios de aceite
- [ ] `socket.io-client` e `idb` em `dependencies`; `msw` e `@mswjs/socket.io-binding` em `devDependencies`.
- [ ] Sem avisos de peer dependency.
- [ ] Nenhum arquivo em `src/` ou `public/` criado.

## Verificação (Sonnet)
- `npm ls msw @mswjs/socket.io-binding socket.io-client idb` limpo.
- `npm run typecheck && npm run build` → exit 0.
