# 02-020 — Bootstrap do MSW no app

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Bootstrap
**Depende de:** 02-008, 02-016, 02-018, 02-019

## Objetivo
Ligar o worker do MSW antes de montar o app e integrar seed, tempo real e agendador.

## Arquivos
- criar: `src/mocks/browser.ts`
- alterar: `src/main.tsx`
- gerado pelo MSW: `public/mockServiceWorker.js` (versionado)

## Referências
- docs/arquitetura/pastas.md (`main.tsx` é o único que importa de `mocks/`)
- docs/api-mock/cenarios.md (`VITE_API_MOCKING`; precisa funcionar também no build de preview)
- docs/qualidade/lighthouse.md (o worker é registrado antes do app montar)

## Instruções
1. `npx msw init public/ --save` (gera `public/mockServiceWorker.js` e a entrada `msw.workerDirectory` no `package.json`; as duas mudanças entram no commit).
2. `browser.ts`: `setupWorker(...handlers)` com `handlers = [...realtimeHandlers]` por enquanto (os handlers de recurso entram com cada fluxo; uma lista `resourceHandlers` vazia fica pronta para receber os arquivos de `handlers/`). Exportar `startMocking()`: `ensureSeeded()` → `worker.start({ onUnhandledRequest })` com `onUnhandledRequest` que **erra** em chamadas para o prefixo da API (para esquecer um handler ficar óbvio) e ignora o resto (assets) → `startScheduler()`.
3. Em `MODE === 'test'`, expor `window.__kurioMock = { createMockWalletProvider, triggerPriceChange, triggerStockChange, dropConnections }` (só para os testes do Playwright; nunca em dev ou produção).
4. `main.tsx`: se `import.meta.env.VITE_API_MOCKING === 'enabled'`, `await import('@/mocks/browser')` e `await startMocking()` **antes** de `createRoot(...).render`; senão, renderiza direto. O import dinâmico garante que o MSW não vai para o bundle quando o mock estiver desligado.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/browser.ts src/main.tsx public/mockServiceWorker.js package.json` e `git commit -m "02-020: bootstrap do MSW"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Com `VITE_API_MOCKING=disabled` o app renderiza sem registrar o worker.
- [ ] O worker é registrado antes do primeiro render.
- [ ] `window.__kurioMock` só existe em `MODE === 'test'`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- `npm run build:test` + `preview`: aba Application mostra o worker ativo e `kurio-mock-db` populado.
