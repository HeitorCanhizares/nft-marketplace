# 02-007 — Respostas de erro no formato do contrato

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Cenários (erros)
**Depende de:** 02-002, 02-005

## Objetivo
Fabricar as respostas de erro da API simulada no formato de contratos.md, com mensagens em PT-BR.

## Arquivos
- criar: `src/mocks/scenarios/errors.ts`

## Referências
- docs/api-mock/contratos.md#formato-de-erro

## Instruções
1. `apiError(code: ApiErrorCode, options?: { message?: string; fields?: Record<string, string>; details?: Record<string, unknown> }): Response` (usa `HttpResponse.json` do MSW) com o **status correto** de cada código da tabela do contrato.
2. Mensagens padrão em PT-BR por código (ex.: `SESSION_EXPIRED` → "Sua sessão expirou. Entre novamente.", `INTERNAL_ERROR` → "Algo deu errado. Tente novamente.", `SERVICE_UNAVAILABLE` → "Serviço indisponível no momento.", `NOT_FOUND` → "Não encontramos o que você procura."). `options.message` sobrescreve.
3. `networkError(): Response` → `HttpResponse.error()`.
4. `randomServerError(): Response` sorteia entre `INTERNAL_ERROR` (500), `BAD_GATEWAY` (502) e `SERVICE_UNAVAILABLE` (503).
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/scenarios/errors.ts` e `git commit -m "02-007: respostas de erro do mock"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Tabela código→status idêntica à de `contratos.md`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Conferir a tabela código→status contra `contratos.md`.
