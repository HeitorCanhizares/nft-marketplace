# 05-037 — Rotas protegidas: `/pagamento`, `/pedido/$orderId` e `/perfil`

**Status:** pendente
**Fluxo / subitem:** Login › 8 (rotas protegidas sem sessão → `/entrar?redirect=`)
**Depende de:** 05-033, 05-035

## Objetivo
Aplicar a guarda `requireAuth` às rotas que exigem login. O layout `/perfil` protege também `/perfil`, `/perfil/dados` e `/perfil/carteiras` (as filhas herdam o `beforeLoad` do pai).

## Arquivos
- alterar: `src/routes/pagamento.tsx`, `src/routes/pedido.$orderId.tsx`, `src/routes/perfil.tsx`

## Referências
- docs/arquitetura/rotas.md (tabela: `/pagamento`, `/pedido/$orderId`, `/perfil`, `/perfil/dados`, `/perfil/carteiras` → **logado**) e docs/fluxos/login.md (subitem 8)
- `src/app/routeGuards.ts` (`requireAuth`)
- `/pagamento` com carrinho vazio → `/carrinho` é da fase 11; aqui só a sessão.

## Instruções
1. Nas três rotas: `beforeLoad: requireAuth` (importar de `@/app/routeGuards`). Nada mais muda (`staticData`, componentes provisórios e comentários de fase ficam).
2. Não mexer em `perfil.index.tsx`, `perfil.dados.tsx` e `perfil.carteiras.tsx` (herdam do layout); conferir isso no navegador.
3. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes/pagamento.tsx "src/routes/pedido.\$orderId.tsx" src/routes/perfil.tsx` e `git commit -m "05-037: rotas protegidas"` (aspas por causa do `$` no nome do arquivo).

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Deslogado: `/pagamento`, `/pedido/abc`, `/perfil`, `/perfil/dados` e `/perfil/carteiras` vão para `/entrar?redirect=<caminho>` (com `replace`).
- [ ] Logado: as cinco rotas abrem normalmente.
- [ ] Com `loading` (sessão sendo recuperada) **não** redireciona: espera e decide pelo resultado.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Os testes do `layout.spec.ts` que visitam essas rotas deslogados quebram de propósito; o 05-041 os ajusta.
- Coberto no 05-046.
