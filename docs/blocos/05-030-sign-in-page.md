# 05-030 — Página SignIn (modal no desktop, página no mobile)

**Status:** pendente
**Fluxo / subitem:** Login › 1, 2, 3 e 4 (montagem da tela)
**Depende de:** 03-015, 05-002, 05-020, 05-021, 05-022, 05-027, 05-028, 05-029

## Objetivo
Montar a página de Login: no desktop, a Início ao fundo com o `AuthDialog`; no mobile, a página cheia. Liga o formulário ao `signIn` do `AuthContext` e trata o fechar.

## Arquivos
- criar: `src/pages/SignIn/SignIn.tsx`

## Referências
- docs/fluxos/login.md (todos os subitens) e docs/arquitetura/rotas.md (a rota é a mesma nos dois tamanhos; `useMediaQuery`)
- `src/contexts/auth.ts` (`useAuth`), `src/hooks/useMediaQuery.ts` (`useIsDesktop`), `src/lib/redirect.ts` (`closeTarget`), `src/hooks/useAuthSuccess.ts`, `src/pages/Home/Home.tsx`

## Instruções
1. Props: `redirect?: string` (a rota passa o valor já validado). Pages não chamam Axios; usam `useAuth().signIn`.
2. `handleSubmit(values)`: `const response = await signIn(values); await finishAuth(response)` (`useAuthSuccess()`, sem `welcome`). Erros **não** são tratados aqui: sobem para o `LoginForm`.
3. `defaultEmail`: `useLocation({ select: (location) => location.state.email })` (vem do "Entrar com este e-mail" do cadastro; **nunca** da URL).
4. `useIsDesktop()`:
   - **mobile:** `<AuthForm mode="login" variant="mobile" redirect={redirect}><LoginForm variant="mobile" … /></AuthForm>`;
   - **desktop:** `<Home />` (fundo) + `<AuthDialog title="Entrar" onClose={handleClose}><AuthForm mode="login" variant="desktop" redirect={redirect}><LoginForm variant="desktop" … /></AuthForm></AuthDialog>`.
5. `handleClose`: `navigate({ href: closeTarget(redirect), state: { skipRouteFocus: true } })` (Esc, X e clique fora). `href` porque o `redirect` pode ter busca e hash.
6. **Não navegar depois do login**: a guarda de rota (`requireGuest`, 05-033/05-036) leva o usuário ao `redirect` (ou `/`) assim que a sessão muda. Comentar em uma linha.
7. Fechamento: `npx prettier --write src/pages/SignIn/SignIn.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/pages/SignIn/SignIn.tsx` e `git commit -m "05-030: página SignIn"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SignIn`; não importa Axios nem `services/api`.
- [ ] Desktop: `Home` ao fundo e o modal por cima; mobile: só a página (um único `<h1>` "Entrar").
- [ ] Redimensionar de 1023 para 1024 px troca a página pelo modal sem quebrar nem recarregar (o texto já digitado pode ser perdido; não é exigido preservá-lo).
- [ ] Fechar leva a `redirect` público ou a `/`, e a `/` quando o `redirect` exige login.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Só funciona na tela depois do 05-036 (rota); testes no 05-043 e 05-047.
