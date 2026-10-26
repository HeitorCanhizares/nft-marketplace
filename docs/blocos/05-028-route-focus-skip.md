# 05-028 — Foco ao fechar o modal: estado de navegação `skipRouteFocus`

**Status:** concluído
**Fluxo / subitem:** Login › 1 (Esc/X fecham e o foco volta a quem abriu); Cadastro › 4 (e-mail passado por estado de navegação)
**Depende de:** 04-012, 04-032
**Depende de decisão:** pergunta 15 do relatório da fase 05

## Objetivo
Registrar no roteador o estado de navegação usado pelo Login/Cadastro e fazer o `useRouteFocus` **não** puxar o foco para o `<h1>` quando o usuário fecha o modal, para o Radix devolver o foco ao botão que o abriu (regra de acessibilidade do `Dialog`).

## Arquivos
- alterar: `src/app/router.tsx`, `src/hooks/useRouteFocus.ts`

## Referências
- docs/qualidade/acessibilidade.md (Dialog: "o foco volta ao elemento que abriu"; teste de teclado: abrir e fechar o modal só com teclado, o foco volta ao gatilho) e docs/arquitetura/rotas.md (troca de rota: foco no `<h1>`)
- docs/fluxos/cadastro.md (subitem 4: "Entrar com este e-mail" passa por **estado de navegação**, sem pôr o e-mail na URL)
- `src/hooks/useRouteFocus.ts` (04-012: assina `router.subscribe('onResolved', …)`)

## Instruções
1. `router.tsx`: aumentar o `HistoryState` do TanStack: `declare module '@tanstack/history' { interface HistoryState { skipRouteFocus?: boolean; email?: string } }` (conferir o nome do módulo na versão instalada). Nenhum outro valor de `createRouter` muda.
2. `useRouteFocus.ts`: no handler do `onResolved`, depois dos testes atuais (carregamento inicial, só search/hash mudou), **retornar sem focar** quando `toLocation.state.skipRouteFocus === true`. O resto fica igual. Comentar em uma linha o porquê. Conferir no tipo do evento o nome do campo (`toLocation`); se for outro, usar `router.state.location.state`.
3. Quem usa: o fechar do `SignIn`/`SignUp` (05-030 e 05-031) navega com `state: { skipRouteFocus: true }`.
4. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npx playwright test tests/e2e/layout.spec.ts -g "foco e título"` verde. Commit: `git add src/app/router.tsx src/hooks/useRouteFocus.ts` e `git commit -m "05-028: estado de navegação skipRouteFocus"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; `Register` e `StaticDataRouteOption` do router intactos.
- [ ] `navigate({ …, state: { skipRouteFocus: true } })` compila e **não** move o foco para o `<h1>`.
- [ ] Sem o estado, o foco no `<h1>` e o título do documento funcionam como antes (04-033, item 11).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; item 11 do `layout.spec.ts` verde.
- Coberto no 05-047 (abrir e fechar o modal só pelo teclado).
