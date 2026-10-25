# 03-007 — Cliente HTTP e eventos de sessão

**Status:** pendente
**Fluxo / subitem:** Fase 03 › HTTP
**Depende de:** 03-006, 03-001

## Objetivo
Criar a instância única do Axios com interceptores e o canal de eventos de sessão expirada.

## Arquivos
- criar: `src/services/http/client.ts`, `src/services/http/sessionEvents.ts`

## Referências
- docs/arquitetura/estado.md#camada-http-serviceshttp
- docs/api-mock/persistencia.md (`kurio:session`, `kurio:guest-cart-id`)
- docs/api-mock/contratos.md#carrinho (cabeçalho `X-Cart-Id`)

## Instruções
1. `client.ts`: `export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 10_000 })`. Aceitar `signal` (cancelamento) como o Axios já faz.
2. Interceptor de requisição: `Authorization: Bearer <token>` quando `kurio:session` tem token (ler via `src/lib/storage.ts`); **sem sessão**, enviar `X-Cart-Id` com o id do carrinho do visitante (`kurio:guest-cart-id`; se não existir ainda, **não gerar aqui**: o id é criado quando o primeiro item entra no carrinho, fase 07).
3. Interceptor de resposta: todo erro vira `ApiError` (`toApiError`). Se `code === 'SESSION_EXPIRED'`, chama `emitSessionExpired()` e **mesmo assim rejeita** o erro.
4. `sessionEvents.ts`: `onSessionExpired(handler): () => void` e `emitSessionExpired(): void` (lista de assinantes simples, sem dependências). Será usado pelo `AuthContext` e pelo cliente do socket (`session:expired`).
5. Exportar `HTTP_TIMEOUT_MS` (10 000) para os testes.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/http/client.ts src/services/http/sessionEvents.ts` e `git commit -m "03-007: cliente HTTP"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Nenhum import de React nesta camada.
- [ ] O erro `SESSION_EXPIRED` dispara o evento **uma vez por resposta**.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 com handlers de execução (`__kurioMock.msw`): cabeçalhos, `ApiError`, timeout e `SESSION_EXPIRED`.
