# 06-059 — Ponte de teste e ajudantes da fase 06

**Status:** pendente
**Responsável:** Sonnet (infraestrutura de teste)
**Fluxo / subitem:** Fase 06 › Testes
**Depende de:** 06-057, 06-028
**Depende de decisão:** pergunta 16 do relatório da fase 06 (como forçar respostas fora de ordem)

## Objetivo
Expor em `window.__kurio`/`window.__kurioMock` (só em `MODE === 'test'`) o que os testes da Início precisam e criar os ajudantes de teste: registrar as chamadas à API e atrasar uma rota de forma determinística.

## Arquivos
- alterar (infraestrutura de teste, só o Sonnet): `src/app/TestBridge.tsx`
- alterar (idem): `src/mocks/browser.ts`
- alterar: `tests/e2e/helpers.ts`

## Referências
- docs/blocos/05-042 (padrão da ponte; **sem UI**; sai do build de produção: `grep -r __kurio dist/` vazio) e `tests/e2e/helpers.ts` (`useHandler`, `bootWithHandlers`, `collectAnnouncements`)
- `src/mocks/realtime/server.ts` (`getSubscribedNftIds`), MSW 2 (`worker.events`, `worker.listHandlers()`, `RequestHandler.run`)

## Instruções
1. `TestBridge.tsx`: acrescentar `catalog: { validateHomeSearch, toCatalogParams, hasActiveFilters, promoToSearch }` (de `schemas/catalog`, `services/api/nfts`, `lib/catalogOptions`) e `schemas.catalog` (`@/schemas/catalog`). Atualizar o tipo `KurioTestApi`.
2. `mocks/browser.ts`: em `KurioMockTestApi` e no objeto exposto, acrescentar `getSubscribedNftIds` (de `./realtime/server`).
3. `tests/e2e/helpers.ts`:
   - `recordApi(page, pathPrefix)`: no navegador, ouve `worker.events.on('request:start', ...)` (o `window.__kurioMock.msw.worker` expõe `events`) e guarda em `window.__api` objetos `{ method, url, search: Record<string,string>, headers: { authorization?, xCartId? }, body? }` das requisições cujo caminho começa com `pathPrefix`; devolve funções `calls()` e `clear()` para o teste;
   - `delayRoute(page, method, path, delayMs: (url: URL) => number)`: usa `worker.listHandlers()` para achar o handler original da rota e registra com `worker.use` um handler que chama `original.run({ request, requestId })` e **espera** `delayMs(url)` antes de devolver a resposta (assim o teste controla a ordem: a 1ª requisição demora, a 2ª não). Se `run` não existir nessa versão do MSW, **parar e relatar** (fallback: cenário `jitter` repetido).
4. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build && npm run build:test` → exit 0; `grep -r __kurio dist/` continua **vazio** no build de produção. Commit: `git add src/app/TestBridge.tsx src/mocks/browser.ts tests/e2e/helpers.ts` e `git commit -m "06-059: ponte de teste da fase 06"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; nada exposto fora de `MODE === 'test'`.
- [ ] `window.__kurio.catalog` e `window.__kurioMock.getSubscribedNftIds` existem no build de teste; `recordApi` registra a URL e os parâmetros de `GET /api/nfts`; `delayRoute` faz a 1ª resposta chegar depois da 2ª.

## Verificação (Sonnet)
- `npm run test:e2e` → os testes anteriores continuam verdes.
