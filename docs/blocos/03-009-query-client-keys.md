# 03-009 — QueryClient e fábrica de chaves

**Status:** pendente
**Fluxo / subitem:** Fase 03 › TanStack Query
**Depende de:** 03-006

## Objetivo
Criar o `QueryClient` com as políticas do estado.md e a fábrica de chaves de query.

## Arquivos
- criar: `src/app/queryClient.ts`, `src/hooks/queryKeys.ts`

## Referências
- docs/arquitetura/estado.md#tanstack-query (chaves, staleTime, retry)

## Instruções
1. `queryKeys.ts` exatamente como estado.md: `nfts.list(params)`, `nfts.detail(id)`, `nfts.related(id)`, `nfts.reviews(id, page)`, `home`, `favorites`, `cart`, `quote(input)`, `orders.detail(id)`, `orders.pending`, `profile`, `wallets`, `session`. Cada função devolve uma tupla `as const` com prefixo estável (ex.: `['nfts', 'list', params]`) e exportar `nfts.all`, `orders.all` para invalidação por prefixo. Exportar `PRIVATE_QUERY_ROOTS` (`favorites`, `cart`, `quote`, `orders`, `profile`, `wallets`, `session`) para o `clearPrivateSession`.
2. `queryClient.ts`: `createQueryClient()` com `staleTime: 30_000`, `retry` para queries `(count, error) => count < 2 && isRetryable(error)` e `retryDelay` crescente (500 ms, 1000 ms), `mutations.retry: false`. **Não** ativar `refetchOnWindowFocus` além do padrão. Exportar também a instância `queryClient` única usada pelo app.
3. Nenhum hook de recurso nesta fase.
Rodar `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/queryClient.ts src/hooks/queryKeys.ts` e `git commit -m "03-009: QueryClient e chaves"`. Não rodar `npm run format` global; usar `npx prettier --write` só nos arquivos do bloco.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Camadas respeitadas (pastas.md): `services/api` não conhece React; `components/shared` e `contexts` não chamam Axios direto; nada importa de `src/mocks/` além de `main.tsx`.
- [ ] Mensagens ao usuário em PT-BR; código e nomes em inglês.
- [ ] Erro 4xx **não** é repetido; 5xx e rede são repetidos até 2 vezes.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Testado no 03-019 (contagem de chamadas a um handler que falha com 500, 404 e rede).
