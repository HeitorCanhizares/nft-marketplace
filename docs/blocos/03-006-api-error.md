# 03-006 — ApiError

**Status:** pendente
**Fluxo / subitem:** Fase 03 › HTTP
**Depende de:** 03-002

## Objetivo
Criar o erro tipado que o app usa em toda falha de HTTP.

## Arquivos
- criar: `src/services/http/ApiError.ts`

## Referências
- docs/arquitetura/estado.md#camada-http-serviceshttp
- docs/api-mock/contratos.md#formato-de-erro

## Instruções
1. `class ApiError extends Error` com `status` (0 quando não houve resposta), `code` (`ApiErrorCode` do servidor **ou** um código de cliente: `'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'CANCELED' | 'UNKNOWN'`), `message` (já em PT-BR), `fields?`, `details?`.
2. Exportar `isApiError(e)` e `isRetryable(e)` (`true` só para erro de rede, timeout e 5xx; **nunca** para 4xx nem `CANCELED`).
3. Exportar `toApiError(unknown): ApiError`: converte erro do Axios (resposta com corpo válido por `apiErrorBodySchema` → ApiError do servidor; sem resposta → `NETWORK_ERROR` ou `TIMEOUT` (`ECONNABORTED`/`ETIMEDOUT`); cancelamento (`axios.isCancel`) → `CANCELED`; resposta fora do contrato → `INVALID_RESPONSE`). Mensagens de cliente em PT-BR ("Sem conexão com o servidor. Verifique sua internet e tente novamente.", "A requisição demorou demais.", "Resposta inesperada do servidor.").
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/http/ApiError.ts` e `git commit -m "03-006: ApiError"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] 4xx e `CANCELED` nunca são `isRetryable`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 com respostas simuladas (status, corpo, rede, timeout, cancelamento).
