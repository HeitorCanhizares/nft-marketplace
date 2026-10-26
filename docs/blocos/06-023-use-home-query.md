# 06-023 — Hook `useHome` (destaques da Início)

**Status:** concluído
**Fluxo / subitem:** Início › 1, 2, 10 (hero, destaque, promos, blog) e 12 (erro isolado)
**Depende de:** 06-005, 03-009

## Objetivo
Criar a query de `GET /home`, independente da do catálogo.

## Arquivos
- criar: `src/hooks/useHome.ts`

## Referências
- docs/arquitetura/estado.md (Chaves: `home`; `signal` para cancelar; retry só em rede/5xx pelo `QueryClient`) e docs/fluxos/inicio.md (subitem 12: "Erro em `GET /home` não derruba o catálogo")
- `src/hooks/queryKeys.ts` (`home`), `src/services/api/nfts.ts` (`getHome`)

## Instruções
1. `useHome()`: `useQuery({ queryKey: home, queryFn: ({ signal }) => getHome(signal) })`; devolve o resultado do `useQuery` sem mexer. **Sem** `throwOnError`: o erro fica no resultado para a página mostrar o estado de erro só nessa área.
2. Fechamento: `npx prettier --write src/hooks/useHome.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useHome.ts` e `git commit -m "06-023: hook useHome"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; a chave é `['home']`.
- [ ] Erro `500` em `GET /home` aparece em `isError` (não lança para o roteador).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-064.
