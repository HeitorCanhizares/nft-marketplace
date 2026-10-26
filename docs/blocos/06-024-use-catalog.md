# 06-024 — Hook `useCatalog` (consulta do catálogo)

**Status:** concluído
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
3. `useCatalog(search: HomeSearch, isDesktop: boolean)` — **proibido ler ou escrever `ref.current` durante o render** (a regra `react-hooks/refs` bloqueia; não desligar a regra, não usar cast). O "último resultado" fica em **state**, com o padrão oficial "ajustar state quando algo muda durante o render" (react.dev, *You Might Not Need an Effect*), sem `useEffect`:
   - `const params = toCatalogParams(search, isDesktop)`; `const paramsKey = JSON.stringify(params)` (sem `useMemo`: a chave da query já é comparada por conteúdo);
   - `const query = useQuery({ queryKey: nfts.list(params), queryFn: ({ signal }) => getCatalog(params, signal), placeholderData: keepPreviousData })`; `const { data, isPlaceholderData } = query`;
   - `const [last, setLast] = useState<{ key: string; ids: string[] } | null>(null)` (ids na ordem exibida, da última resposta **real**, e a chave dela);
   - `items = useMemo(...)` com deps `[data, isPlaceholderData, last, paramsKey]` e **tudo dentro do callback**: sem `data` → `undefined`; `previousIds = last && (isPlaceholderData || last.key === paramsKey) ? last.ids : []`; devolve `keepOrder(previousIds, data.items)`. (Placeholder = a lista da chave anterior, que continua na ordem em que estava; chave nova sem placeholder = ordem do servidor, `previousIds = []`.) O `useMemo` é obrigatório: `items` precisa manter a identidade entre renders, senão o `useLiveChanges` (06-030) entra em laço;
   - logo depois, **durante o render** (não em efeito): `if (items && !isPlaceholderData) { const ids = items.map((item) => item.id); if (last?.key !== paramsKey || last.ids.join() !== ids.join()) setLast({ key: paramsKey, ids }) }`. O `if` é a trava contra laço (o render seguinte encontra `last` igual e não chama `setLast`);
   - devolve `{ ...query, params, items }`.
4. Não buscar nada fora do `getCatalog`; sem `throwOnError`.
5. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useCatalog.ts src/lib/stableOrder.ts src/hooks/queryKeys.ts` e `git commit -m "06-024: hook useCatalog"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`, **sem `ref` e sem `eslint-disable`** (`npm run lint` limpo); a chave contém os parâmetros **como enviados à API** (`page`, `pageSize`, `tab`…).
- [ ] Trocar o filtro mantém os dados anteriores (`isPlaceholderData: true`) até a resposta nova; a requisição antiga é cancelada.
- [ ] Dois resultados seguidos da mesma chave com os mesmos ids em ordem diferente (tempo real) mantêm a ordem da tela; trocar o filtro (chave nova) usa a ordem do servidor.
- [ ] `keepOrder(['a','b','c'], [c,a,b])` → `[a,b,c]`; com um id novo ou faltando → ordem do servidor.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061 e 06-064 (fora de ordem) e 06-065 (ordem estável).
