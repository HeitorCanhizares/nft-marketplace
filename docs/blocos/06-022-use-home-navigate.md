# 06-022 — Hook `useHomeNavigate` (mudar a URL da Início)

**Status:** pendente
**Fluxo / subitem:** Início › 3 a 7, 9 (filtros, abas, ordem, busca, páginas na URL)
**Depende de:** 06-003
**Depende de decisão:** pergunta 11 do relatório da fase 06 (histórico: `push` ou `replace`)

## Objetivo
Concentrar num hook todas as mudanças de URL da Início, aplicando a regra "trocar filtro, aba, busca ou ordem volta para a página 1".

## Arquivos
- criar: `src/hooks/useHomeNavigate.ts`

## Referências
- docs/fluxos/inicio.md (subitem 3: "Trocar filtro, aba, busca ou ordem volta para a página 1"; subitem 6: "Limpar filtros") e docs/arquitetura/rotas.md (a Início guarda tudo na URL)
- `src/pages/SignIn/SignIn.tsx` (a Início também é renderizada atrás do modal em `/entrar`: **por isso** o hook recebe a busca atual por parâmetro e navega com `to: '/'` explícito, sem `useSearch`)

## Instruções
1. `useHomeNavigate(search: HomeSearch)` devolve funções estáveis (`useCallback`), todas usando `useNavigate()` e `navigate({ to: '/', search: next, replace, hash? })` com `next` **sempre** com as 9 chaves de `HomeSearch` (valores ou `undefined`):
   - `setFilters(changes: Partial<HomeSearch>, options?: { replace?: boolean })`: `next = { ...search, ...changes, pagina: undefined }`; **`push`** por padrão; `replace: true` só quando pedido;
   - `setPage(page: number, options?: { replace?: boolean })`: `next = { ...search, pagina: page <= 1 ? undefined : page }`; `push` por padrão;
   - `clearFilters()`: remove `q`, `colecao`, `rede`, `precoMin`, `precoMax` e `pagina`; **mantém** `aba`, `ordem` e `favoritos`; `push`;
   - `explore(hash = 'catalogo')`: `navigate({ to: '/', search, hash, replace: true })` (sem tocar nos filtros; usado pelo "EXPLORAR").
2. Não ler a URL nem usar `Route.useSearch`. Export nomeado.
3. Fechamento: `npx prettier --write src/hooks/useHomeNavigate.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useHomeNavigate.ts` e `git commit -m "06-022: hook useHomeNavigate"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `setFilters({ colecao: 'musica' })` a partir de `{ pagina: 3 }` deixa `pagina` indefinida.
- [ ] `clearFilters` mantém `aba`, `ordem` e `favoritos`.
- [ ] Funciona com a Início renderizada fora de `/` (navega para `/`, não para a rota atual).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Coberto no 06-061.
