# 03-014 — Cliente da API de autenticação

**Status:** pendente
**Fluxo / subitem:** Fase 03 › Autenticação
**Depende de:** 03-005, 03-008

## Objetivo
Criar as funções de HTTP de autenticação (sem lógica de estado).

## Arquivos
- criar: `src/services/api/auth.ts`

## Referências
- docs/api-mock/contratos.md#sessão-e-conta
- docs/fluxos/login.md e cadastro.md (API)

## Instruções
1. Funções tipadas por `validate`: `login({ email, password })`, `register({ username, email, password })`, `getSession()` (`GET /auth/session`), `refreshSession()` (`POST /auth/refresh`), `logout()` (`POST /auth/logout`, `204`) e `checkAvailability({ email } | { username })`.
2. `getSession` aceita `signal` (cancelamento). Nenhuma função guarda nada em storage: só chama a API.
3. Sem React. Os handlers do MSW desses endpoints nascem na fase 05; até lá, o teste do 03-019 usa handlers de execução.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/api/auth.ts` e `git commit -m "03-014: cliente da API de autenticação"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 com handlers de execução.
