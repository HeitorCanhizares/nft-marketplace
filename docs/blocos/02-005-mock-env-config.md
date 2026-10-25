# 02-005 — Leitura das variáveis de ambiente do mock

**Status:** pendente
**Fluxo / subitem:** Fase 02 › Cenários (configuração)
**Depende de:** 02-004

## Objetivo
Ler e converter as variáveis `VITE_*` do mock em um objeto tipado e validado.

## Arquivos
- criar: `src/mocks/scenarios/config.ts`

## Referências
- docs/api-mock/cenarios.md#variáveis-de-ambiente
- src/vite-env.d.ts (tipos das variáveis)

## Instruções
1. Exportar `mockConfig` (objeto congelado) com: `mockingEnabled`, `apiBaseUrl`, `latency: { minMs, maxMs }`, `errorRate`, `networkErrorRate`, `sessionTtlSeconds`, `quoteTtlSeconds`, `paymentDelayMs`, `paymentDeclineRate`, `realtimeEnabled`, `envScenarios: string[]` (lista de `VITE_MOCK_SCENARIOS` separada por vírgula, sem espaços e sem vazios), `seedReset`.
2. Converter números com `Number()`; valor inválido ou fora do intervalo (taxas fora de 0–1, latência negativa, `min > max`) → lançar `Error` com mensagem em PT-BR dizendo qual variável está errada (falhar cedo é melhor que simular errado).
3. Exportar `apiPath(path: string): string` que concatena `apiBaseUrl` e `path` (sem barras duplicadas), usado pelos handlers.
4. Exportar `isTestMode = import.meta.env.MODE === 'test'`.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/mocks/scenarios/config.ts` e `git commit -m "02-005: configuração do mock a partir do ambiente"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; tipos exportados com nome.
- [ ] `src/mocks/**` não importa nada do app além de `src/types`, `src/schemas` e `src/lib` (regra de camadas de pastas.md).
- [ ] Comentários só onde o porquê não é óbvio.
- [ ] Todas as 13 variáveis do `.env` são usadas (nenhuma ignorada).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Confirmado no 02-022: o build `--mode test` usa 50 ms de latência fixa (prova que o `.env.test` é carregado: pendência da fase 00).
