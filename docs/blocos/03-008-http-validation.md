# 03-008 — Validação de resposta com zod

**Status:** pendente
**Fluxo / subitem:** Fase 03 › HTTP
**Depende de:** 03-006, 03-007

## Objetivo
Dar aos serviços de recurso uma forma única de validar a resposta e transformá-la em erro quando fugir do contrato.

## Arquivos
- criar: `src/services/http/validate.ts`

## Referências
- docs/arquitetura/estado.md#camada-http-serviceshttp (resposta fora do contrato vira erro, não dado quebrado)

## Instruções
1. `validate<T>(schema: z.ZodType<T>, data: unknown): T`: `safeParse`; se falhar, lança `ApiError` com `code: 'INVALID_RESPONSE'`, `status: 200` e `details.issues` (lista curta de caminhos e mensagens) para depuração (`console.error` só fora de `MODE === 'test'`).
2. `get<T>(url, schema, config?)`, `post<T>(url, schema, body?, config?)`, `put`, `patch`, `del`: atalhos que chamam `http` e devolvem `validate(schema, response.data)`; para `204` aceitar `schema: null` (retorna `undefined`). Servem de base para `services/api/*`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/services/http/validate.ts` e `git commit -m "03-008: validação de resposta"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019: resposta com preço numérico vira `INVALID_RESPONSE`.
