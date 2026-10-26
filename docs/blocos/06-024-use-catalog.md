# 06-024 — Hook `useCatalog` (consulta do catálogo)

**Status:** pendente
**Fluxo / subitem:** Início › 3, 12 (grade, trocar filtro sem piscar, respostas fora de ordem, ordem estável)
**Depende de:** 06-003, 06-005, 03-009
**Depende de decisão:** perguntas 4 e 12 do relatório da fase 06

## Objetivo
Criar a query do catálogo com `keepPreviousData`, cancelamento por `signal` e ordem estável das atualizações em tempo real.

## Arquivos
- criar: `src/hooks/useCatalog.ts`
- criar: `src/lib/stableOrder.ts`
- alterar: `src/hooks/queryKeys.ts`

## Referências
- docs/arquitetura/estado.md (`placeholderData: keepPreviousData`; "cada query passa o `signal` do Query para o Axios. Mudou o filtro, a requisição antiga é cancelada") e docs/fluxos/inicio.md (subitens 11 e 12: "Nunca reordena a grade"; "a grade anterior continua visível, esmaecida")
- `src/hooks/queryKeys.ts` (`nfts.list(params)`), `src/services/api/nfts.ts` (`toCatalogParams`, `getCatalog`)

## Instruções
1. `queryKeys.ts`: acrescentar ao objeto `nfts` o prefixo `lists: ['nfts', 'list'] as const` (para invalidar ou atualizar todas as listas). Não mudar o resto.
2. `lib/stableOrder.ts`: `keepOrder<T extends { id: string }>(previous: readonly string[], next: readonly T[]): T[]` — se `next` tem **exatamente o mesmo conjunto de ids** que `previous` (mesmo em ordem diferente), devolve os itens de `next` **na ordem de `previous`**; caso contrário devolve `next` como veio. Pura, sem React.
3. `useCatalog(search: HomeSearch, isDesktop: boolean)`:
   - `params = toCatalogParams(search, isDesktop)` (memoizado pelo conteúdo: usar `JSON.stringify(params)` como dependência);
   - `useQuery({ queryKey: nfts.list(params), queryFn: ({ signal }) => getCatalog(params, signal), placeholderData: keepPreviousData })`;
   - devolve `{ ...query, params, items }`, onde `items` é `keepOrder(idsDoUltimoResultadoDessaChave, query.data.items)` (guardar os ids numa `ref` por chave; **resetar a `ref` quando a chave muda**; ignorar `placeholderData` para não misturar chaves: usar `query.isPlaceholderData` para não atualizar a `ref`).
4. Não buscar nada fora do `getCatalog`; sem `throwOnError`.
5. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useCatalog.ts src/lib/stableOrder.ts src/hooks/queryKeys.ts` e `git commit -m "06-024: hook useCatalog"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a chave contém os parâmetros **como enviados à API** (`page`, `pageSize`, `tab`…).
- [ ] Trocar o filtro mantém os dados anteriores (`isPlaceholderData: true`) até a resposta nova; a requisição antiga é cancelada.
- [ ] `keepOrder(['a','b','c'], [c,a,b])` → `[a,b,c]`; com um id novo ou faltando → ordem do servidor.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061 e 06-064 (fora de ordem) e 06-065 (ordem estável).
