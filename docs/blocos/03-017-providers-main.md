# 03-017 — Providers e montagem no main.tsx

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Montagem
**Depende de:** 03-009, 03-010, 03-012, 03-015, 03-016

## Objetivo
Juntar os providers, registrar o simulador de carteira e montar o app.

## Arquivos
- criar: `src/app/Providers.tsx`
- alterar: `src/main.tsx`

## Referências
- docs/arquitetura/pastas.md (`app/`: providers; só `main.tsx` importa de `mocks/`)
- docs/arquitetura/estado.md

## Instruções
1. `Providers.tsx`: `QueryClientProvider` (instância de `queryClient.ts`), `LiveAnnouncerProvider`, `AuthProvider` (com `onClearPrivateSession={() => clearPrivateSession(queryClient)}`), nesta ordem (o `AuthProvider` precisa do anunciador). Aceita `children`.
2. `main.tsx`: envolver o `RouterProvider` com `Providers`; quando `VITE_API_MOCKING === 'enabled'`, depois de `startMocking()`, **registrar o simulador de carteira** com `registerWalletProvider(createMockWalletProvider())` (o módulo `@/mocks/browser` passa a exportar essa função ou o próprio `main.tsx` importa de `@/mocks/wallet/provider`; escolher a segunda opção, que mantém `browser.ts` como está). Conectar o socket (`connectSocket()`) depois do render.
3. Não montar `Toaster`, layout nem rotas novas (fase 04).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/Providers.tsx src/main.tsx` e `git commit -m "03-017: providers e montagem"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] A ordem dos providers é Query → LiveAnnouncer → Auth.
- [ ] Com `VITE_API_MOCKING=disabled`, o app monta sem o simulador e sem MSW.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Os testes de fumaça existentes continuam passando.
