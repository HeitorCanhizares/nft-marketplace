# 05-031 — Página SignUp (modal no desktop, página no mobile)

**Status:** pendente
**Fluxo / subitem:** Cadastro › 1, 2, 4 e 5 (montagem da tela)
**Depende de:** 03-015, 05-002, 05-020, 05-021, 05-024, 05-027, 05-028, 05-029

## Objetivo
Montar a página de Cadastro: no desktop, a Início ao fundo com o `AuthDialog`; no mobile, a página cheia. Liga o formulário ao `signUp` do `AuthContext`.

## Arquivos
- criar: `src/pages/SignUp/SignUp.tsx`

## Referências
- docs/fluxos/cadastro.md (todos os subitens) e docs/arquitetura/rotas.md
- `src/pages/SignIn/SignIn.tsx` (05-030: mesma estrutura), `src/contexts/auth.ts` (`useAuth`), `src/hooks/useAuthSuccess.ts`

## Instruções
1. Props: `redirect?: string`. Mesma estrutura do `SignIn` (05-030), trocando:
   - `signIn` → `signUp`; `handleSubmit(values)`: monta `body = { username: values.username, email: values.email, password: values.password }` (**a confirmação nunca vai para a API**; sem variável não usada, por causa do lint), `const response = await signUp(body)`, `await finishAuth(response, { welcome: `Conta criada. Bem-vindo(a), ${response.user.username}!` })`;
   - `LoginForm` → `SignupForm` (com `redirect` para o link "Entrar com este e-mail");
   - `mode="signup"`; `AuthDialog title="Criar conta"`; sem `defaultEmail`.
2. Fechar e navegação pós-cadastro: igual ao `SignIn` (`closeTarget`, `state: { skipRouteFocus: true }`; a guarda `requireGuest` leva ao `redirect`).
3. Fechamento: `npx prettier --write src/pages/SignUp/SignUp.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/pages/SignUp/SignUp.tsx` e `git commit -m "05-031: página SignUp"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `SignUp`; a requisição de cadastro **não** contém `confirmPassword`.
- [ ] Sucesso mostra o toast "Conta criada. Bem-vindo(a), <usuário>!".
- [ ] Desktop: modal sobre `Home`; mobile: página com um único `<h1>` "Criar perfil de colecionador".

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Só funciona na tela depois do 05-036; testes no 05-044 e 05-047.
