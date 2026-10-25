# 00-016 — Tipos das variáveis de ambiente

**Status:** pendente
**Fluxo / subitem:** Fase 00 › `.env` (tipagem)
**Depende de:** 00-015

## Objetivo
Tipar `import.meta.env` com as variáveis do mock para que a leitura delas seja verificada pelo TypeScript nas fases seguintes.

## Arquivos
- criar: `src/vite-env.d.ts`

## Referências
- docs/api-mock/cenarios.md#variáveis-de-ambiente
- docs/arquitetura/estado.md (`VITE_API_BASE_URL`)

## Instruções
1. Criar `src/vite-env.d.ts` com `/// <reference types="vite/client" />` e a augmentação de `ImportMetaEnv` com as 13 variáveis do `.env`, todas `readonly` e do tipo `string` (o Vite entrega tudo como texto; a conversão para número/booleano é da fase 02). Pode-se usar `'enabled' | 'disabled'` em `VITE_API_MOCKING` e `VITE_MOCK_REALTIME`, e `'true' | 'false'` em `VITE_MOCK_SEED_RESET`.
2. Todas as demais variáveis ficam como `string`, sem `?`. `VITE_MOCK_SCENARIOS` também é `string` (vazio quando não há cenário).
3. Não criar leitor de env (`src/mocks/scenarios/` é da fase 02) nem validar valores.
4. Commit: `git add src/vite-env.d.ts` e `git commit -m "00-016: tipos de import.meta.env"`.

## Critérios de aceite
- [ ] As 13 variáveis do `.env` tipadas, nenhuma a mais, nenhuma a menos.
- [ ] `npm run typecheck`, `npm run lint` e `npm run format:check` com exit 0.

## Verificação (Sonnet)
- Conferir a lista contra o `.env`.
- Sanidade (não commitada): `console.log(import.meta.env.VITE_NAO_EXISTE)` num arquivo temporário deve falhar no typecheck; apagar.
- `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
