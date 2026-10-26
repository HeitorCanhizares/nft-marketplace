# 06-057 — `Home` real e rota `/` com a busca completa

**Status:** pendente
**Fluxo / subitem:** Início › todos (liga a página à rota)
**Depende de:** 06-055, 06-056, 06-003, 05-029, 05-038
**Depende de decisão:** pergunta 6 do relatório da fase 06 (`h1` e títulos); pergunta 7 (sem `loader`)

## Objetivo
Trocar o conteúdo provisório da `Home` pela Início de verdade e a rota `/` pela validação completa dos parâmetros, mantendo a Início renderizável atrás do modal de Login/Cadastro.

## Arquivos
- alterar: `src/pages/Home/Home.tsx`
- alterar: `src/routes/index.tsx`

## Referências
- docs/blocos/05-029 e 05-038 (a `Home` é usada pelo `SignIn` e pelo `SignUp` **sem** parâmetros, atrás do modal; a guarda de `favoritos` fica) e docs/arquitetura/rotas.md (parâmetros de `/`; armadilha do `validateSearch`; título do documento)
- `src/pages/SignIn/SignIn.tsx` e `SignUp.tsx` (`<Home />` sem props: **não alterar**)

## Instruções
1. `Home.tsx`: `Home({ search = EMPTY_HOME_SEARCH }: { search?: HomeSearch })`, com `EMPTY_HOME_SEARCH` constante de módulo com as 9 chaves `undefined`. Renderiza `<h1 className="sr-only">Kurio</h1>` e, depois, `isDesktop ? <HomeDesktop search={search} /> : <HomeMobile search={search} />` (`useIsDesktop`). Remover o comentário de "provisório".
2. `routes/index.tsx`: `validateSearch: validateHomeSearch` (do 06-003), apagando o `validateSearch` provisório e o tipo manual; `component: function IndexPage() { return <Home search={Route.useSearch()} /> }`. **Manter** `staticData: { mobileTabBar: true }` e o `beforeLoad` de `favoritos` (`requireAuth`). **Sem `loader`**: os estados de carregamento e erro são por seção (decisão da pergunta 7).
3. Conferir que `src/routeTree.gen.ts` não muda e que `git status` não mostra arquivos gerados novos.
4. Fechamento: `npx prettier --write src/pages/Home/Home.tsx src/routes/index.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/pages/Home/Home.tsx src/routes/index.tsx` e `git commit -m "06-057: Início real e rota com busca completa"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `/` mostra a Início do Figma (desktop e mobile); o título do documento continua "Kurio".
- [ ] `/entrar` e `/cadastro` continuam mostrando a Início **sem filtros** atrás do modal (desktop) e só o formulário (mobile); nada quebra com o modal aberto.
- [ ] `/?pagina=abc&aba=x` abre a Início padrão (a busca inválida não vaza); `/?favoritos=1` deslogado → login.
- [ ] Há exatamente **um** `h1` ("Kurio", só para leitor de tela).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; abrir `/` em 1440×900 e 414×896 e comparar com as capturas; os testes antigos que dependiam da Início provisória serão ajustados no 06-058.
