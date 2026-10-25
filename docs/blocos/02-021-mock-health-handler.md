# 02-021 — Handler de saúde (verificação da base)

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Bootstrap
**Depende de:** 02-020

## Objetivo
Criar uma rota mínima `GET /health` que atravessa o middleware, só para provar a base do mock (não é recurso de negócio).

## Arquivos
- criar: `src/mocks/handlers/health.ts`
- alterar: `src/mocks/browser.ts` (registrar o handler)

## Referências
- docs/blocos/README.md (a fase 02 não cria handlers de recurso; este é de infraestrutura e precisa de aprovação do usuário na revisão)

## Instruções
1. `healthHandlers = [http.get(apiPath('/health'), withMock('GET /health', () => HttpResponse.json({ status: 'ok', seeded: <true se o banco tem NFTs>, now: new Date().toISOString() })))]`.
2. Registrar em `browser.ts`.
3. Nada de dados de negócio na resposta.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/handlers/health.ts src/mocks/browser.ts` e `git commit -m "02-021: handler de saúde"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] A rota passa por latência, falhas e cenários forçados do middleware.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Base dos testes do 02-022 (`fetch('/api/health')` em `page.evaluate`).
