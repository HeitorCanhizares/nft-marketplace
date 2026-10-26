# 05-036 — Rotas `/entrar` e `/cadastro` de verdade

**Status:** pendente
**Fluxo / subitem:** Login e Cadastro › 1 (rotas, `redirect`, só deslogado)
**Depende de:** 05-002, 05-030, 05-031, 05-033, 05-035

## Objetivo
Trocar os placeholders das duas rotas pelas páginas `SignIn` e `SignUp`, com o `redirect` validado pelo schema central e a guarda "só deslogado".

## Arquivos
- alterar: `src/routes/entrar.tsx`, `src/routes/cadastro.tsx`

## Referências
- docs/arquitetura/rotas.md (`/entrar` e `/cadastro`: só deslogado; `redirect` só caminho interno; **armadilha do `validateSearch`**) e docs/blocos/04-008-routes-placeholder-2.md (o `validateSearch` provisório que esta etapa substitui)
- `src/lib/redirect.ts` (`validateAuthSearch`), `src/app/routeGuards.ts` (`requireGuest`)

## Instruções
1. Cada rota: `staticData` mantido (`'Entrar'` / `'Criar conta'`), `validateSearch: validateAuthSearch`, `beforeLoad: requireGuest`, `component` que lê `Route.useSearch()` e renderiza `<SignIn redirect={redirect} />` / `<SignUp redirect={redirect} />`. Remover os comentários "placeholder" e a validação inline.
2. Nenhuma lógica de tela aqui (rotas finas, `rotas.md`).
3. `npx vite build` e conferir o `routeTree.gen.ts` (não deve mudar).
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes/entrar.tsx src/routes/cadastro.tsx` e `git commit -m "05-036: rotas de entrar e cadastro"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] `/entrar?redirect=//evil.com` e `/entrar?redirect=https://evil.com` resultam em `redirect` **indefinido** em `useSearch()` (chave presente com `undefined`); `/entrar?redirect=/carrinho` mantém o valor.
- [ ] `<Link to="/entrar" search={{ redirect: '/carrinho' }}>` compila; `redirect: 5` não.
- [ ] Logado, abrir `/entrar` ou `/cadastro` leva a `redirect` ou `/` sem mostrar a tela.
- [ ] `npm run dev`: `/entrar` mostra o modal (desktop) e a página (mobile); `/cadastro` idem; título do documento "Entrar | Kurio" / "Criar conta | Kurio".

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Captura de `/entrar` e `/cadastro` em 1440×900 e 414×896 comparada com as quatro capturas (medidas do 05-021); testes no 05-043, 05-044 e 05-046.
