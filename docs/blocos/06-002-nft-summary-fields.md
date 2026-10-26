# 06-002 — Campos `soldOut` e `defaultEditionId` no `NftSummary`

**Status:** concluído
**Fluxo / subitem:** Início › 8 (card: esgotado e "adicionar ao carrinho")
**Depende de:** 02-001, 03-003
**Depende de decisão:** pergunta 1 do relatório da fase 06 (mudança de contrato)

## Objetivo
Dar ao card o que ele precisa saber sem chamar o detalhe: se o NFT está esgotado e qual é a edição do preço exibido (a que o botão de carrinho adiciona).

## Arquivos
- alterar: `src/types/nft.ts`
- alterar: `src/schemas/nft.ts`

## Referências
- docs/fluxos/inicio.md (subitem 8: "adiciona 1 unidade da edição do preço exibido"; "NFT esgotado: botão de carrinho desabilitado com texto 'Esgotado'") e docs/api-mock/contratos.md (`NftSummary`; o Opus acrescenta os dois campos)

## Instruções
1. `types/nft.ts`: em `NftSummary`, depois de `isFavorite`, acrescentar `soldOut?: boolean` (todas as edições com `available === 0`) e `defaultEditionId?: string` (id da edição de menor preço entre as com estoque; **ausente** quando `soldOut`). Comentar as duas regras em uma linha cada.
2. `schemas/nft.ts`: em `nftSummaryShape`, acrescentar `soldOut: z.boolean().optional()` e `defaultEditionId: z.string().optional()`. O `nftDetailSchema` herda a forma sozinho. Não tornar obrigatório (carrinho e cotação reusam o schema).
3. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/types/nft.ts src/schemas/nft.ts` e `git commit -m "06-002: soldOut e defaultEditionId no NftSummary"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; os dois campos opcionais nos tipos **e** nos schemas.
- [ ] `tests/e2e/mock-base.spec.ts` e `app-base.spec.ts` continuam verdes (respostas antigas, sem os campos, ainda validam).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- mock-base app-base` verde.
