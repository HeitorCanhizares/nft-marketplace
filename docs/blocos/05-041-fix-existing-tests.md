# 05-041 — Ajustar os testes das fases 03 e 04 às guardas de rota

**Status:** pendente
**Responsável:** Sonnet (o Haiku não escreve testes)
**Fluxo / subitem:** Fase 05 › Rotas protegidas (efeito colateral)
**Depende de:** 05-011, 05-035, 05-037, 05-038, 05-039, 05-040

## Objetivo
Manter verde a suíte existente depois que `/pagamento`, `/pedido/*`, `/perfil/*` e `/?favoritos=1` passam a exigir login e a expiração passa a redirecionar.

## Arquivos
- alterar (só o Sonnet): `tests/e2e/layout.spec.ts`, `tests/e2e/app-base.spec.ts`

## Referências
- `tests/e2e/layout.spec.ts` (`goLoggedIn`, `bootLoggedIn`, `only`) e `tests/e2e/app-base.spec.ts` (expiração com relógio controlado, login e troca de usuário com handlers de execução)
- docs/qualidade/testes.md

## Instruções
1. Rodar `npm run test:e2e` e listar o que quebrou. **Esperado:**
   - `layout.spec.ts` item 2 (item ativo por rota): as rotas `/pagamento`, `/pedido/x`, `/perfil/dados` e `/perfil/carteiras` passam a ser abertas **logado** (`goLoggedIn`), as públicas continuam como estão;
   - item 9 (barra mobile): "Favoritos" e "Perfil" passam a ser testados logado (`bootLoggedIn` antes do `goto`); acrescentar uma verificação curta do que acontece **deslogado** (`/?favoritos=1` e `/perfil` vão a `/entrar?redirect=…`), sem duplicar o 05-046;
   - `app-base.spec.ts`: testes que provocam expiração agora terminam em `/entrar?redirect=…` e o toast "Sua sessão expirou. Entre novamente para continuar."; ajustar as asserções de URL e, onde o teste continuava usando a página anterior, navegar de volta.
2. Handlers de execução (`worker.use`) das fases 03 e 04 **continuam valendo** (têm prioridade sobre os do mock); trocar um handler antigo pelo real **só** se o teste puder ficar mais simples sem perder o objetivo.
3. Não enfraquecer nenhuma asserção para "passar": se algo quebrou por motivo diferente do esperado, **parar e relatar**.
4. Fechamento: `npm run lint && npm run format:check && npm run typecheck` → exit 0; `npm run test:e2e` **todo verde**. Commit: `git add tests/e2e/layout.spec.ts tests/e2e/app-base.spec.ts` e `git commit -m "05-041: ajustar testes às guardas de rota"`.

## Critérios de aceite
- [ ] A suíte completa passa nos projetos `desktop` e `mobile`, duas execuções seguidas.
- [ ] Nenhuma asserção removida sem justificativa; nenhum `data-testid` nem seletor CSS novo.

## Verificação (Sonnet)
- `npm run test:e2e` → tudo passando; `npm run lint && npm run format:check && npm run typecheck && npm run build` → exit 0.
