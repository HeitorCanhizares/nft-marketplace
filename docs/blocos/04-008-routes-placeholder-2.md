# 04-008 — Rotas provisórias (2/4): pedido, entrar, cadastro

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Rotas provisórias
**Depende de:** 04-007

## Objetivo
Criar as rotas `/pedido/$orderId`, `/entrar` e `/cadastro` como placeholders, com o parâmetro `redirect` já validado de forma segura.

## Arquivos
- criar: `src/routes/pedido.$orderId.tsx`, `src/routes/entrar.tsx`, `src/routes/cadastro.tsx`
- gerado pelo plugin (versionado): `src/routeTree.gen.ts`

## Referências
- docs/arquitetura/rotas.md (`redirect` só aceita caminhos internos)
- docs/fluxos/login.md (subitem 4)

## Instruções
Mesmo padrão do 04-007 (`<h1 className="container-page py-8 text-heading font-bold">`).
1. `pedido.$orderId.tsx`: `/pedido/$orderId`, `<h1>Pedido</h1>`, `staticData: { title: 'Pedido' }`; comentário "fase 12 troca pelo OrderConfirmation".
2. `entrar.tsx`: `/entrar`, `<h1>Entrar</h1>`, `staticData: { title: 'Entrar' }`; comentário "fase 05 troca pelo SignIn e troca este `validateSearch` pelo schema zod".
3. `cadastro.tsx`: `/cadastro`, `<h1>Criar conta</h1>`, `staticData: { title: 'Criar conta' }`; comentário "fase 05 troca pelo SignUp".
4. `entrar.tsx` e `cadastro.tsx` com o mesmo `validateSearch: (search: Record<string, unknown>): { redirect?: string } => …`: devolve `redirect` só se for `string`, **começar com `/` e não começar com `//`** (`//host` é um redirecionamento aberto); senão `{}`. Não criar arquivo auxiliar (a fase 05 centraliza a validação).
5. `npx vite build` para regenerar o `routeTree.gen.ts`.
6. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes src/routeTree.gen.ts` e `git commit -m "04-008: rotas provisórias de pedido, entrar e cadastro"`.

## Critérios de aceite
- [ ] `Link to="/entrar" search={{ redirect: '/carrinho' }}` compila; `redirect: 5` não compila.
- [ ] `/entrar?redirect=//evil.com` e `/entrar?redirect=https://evil.com` resultam em `redirect` indefinido.
- [ ] `/entrar?redirect=/carrinho` mantém o valor.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** conferindo a URL final dos três casos do critério acima.
