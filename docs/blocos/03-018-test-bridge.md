# 03-018 — Ponte de teste (só modo test)

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Testes
**Depende de:** 03-017

## Objetivo
Expor, só em `MODE === 'test'`, o que o Playwright precisa para verificar a base sem criar rota de teste.

## Arquivos
- criar: `src/app/TestBridge.tsx`
- alterar: `src/app/Providers.tsx`, `src/mocks/browser.ts`

## Referências
- Decisão a aprovar pelo usuário: exposição de `window.__kurio` (app) só em modo de teste, no mesmo padrão do `window.__kurioMock` (fase 02)

## Instruções
1. `TestBridge.tsx`: componente sem UI, renderizado por `Providers` **apenas quando `import.meta.env.MODE === 'test'`** (condição estática, para o build de produção descartá-lo). Dentro dele, lê os contextos e define `window.__kurio` com: `auth` (getter do `AuthState` atual + `signIn`, `signOut`, `refreshSession`), `announce`, `queryClient`, `http`, `queryKeys`, `socket` (módulo `services/realtime/socket`), `session` (`lib/session`), `schemas` (todos os de `src/schemas/*`), `clearPrivateSession` (já vinculado ao `queryClient`), `walletRegistry` (`services/wallet`). Declarar o tipo global `Window.__kurio` no próprio arquivo.
2. `browser.ts` (mock): em `isTestMode`, expor também `window.__kurioMock.msw = { worker, http, HttpResponse }` (para os testes registrarem handlers de execução com `worker.use`).
3. O build de produção **não** pode conter `__kurio` (conferir com `grep` em `dist/`).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/TestBridge.tsx src/app/Providers.tsx src/mocks/browser.ts` e `git commit -m "03-018: ponte de teste"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] `grep -r __kurio dist/` (build de produção) sem resultados.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Verificado no 03-019.
