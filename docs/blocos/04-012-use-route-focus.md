# 04-012 — Foco no `<h1>` e título do documento a cada troca de rota

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Acessibilidade de navegação
**Depende de:** 04-006

## Objetivo
Cumprir a regra de `rotas.md`: ao trocar de rota, o foco vai para o `<h1>` da nova página e o título do documento é atualizado.

## Arquivos
- criar: `src/hooks/useRouteFocus.ts`

## Referências
- docs/arquitetura/rotas.md (Outras regras)
- docs/qualidade/acessibilidade.md (controle de foco, semântica)

## Instruções
1. `useRouteFocus(): void`, chamado uma vez pelo `AppShell` (04-030). Usa `useRouter()` e `useRouteChrome()`.
2. **Título:** em um `useEffect` com `[title]`, `document.title = title ? `${title} | Kurio` : 'Kurio'`.
3. **Foco:** em um `useEffect` que assina `router.subscribe('onResolved', handler)` (e cancela no cleanup). No handler:
   - ignorar o carregamento inicial (sem `fromLocation`);
   - ignorar quando **só mudaram search ou hash** (mesmo `pathname` de antes): mudar filtro, página ou busca da Início **não** move o foco;
   - caso contrário, em `requestAnimationFrame`, procurar dentro de `#conteudo` o **primeiro `<h1>` visível** (`element.checkVisibility()`; há `<h1>` ocultos por CSS entre desktop e mobile), pôr `tabindex="-1"` nele e chamar `.focus()`. Se não houver `<h1>`, focar o próprio `#conteudo`.
   Conferir no tipo do evento os nomes dos campos (`fromLocation`, `toLocation`, `pathChanged`); se forem diferentes, comparar `pathname` manualmente.
4. O `<h1>` focado não precisa de anel de foco (alvo programático, não é tabulável): `element.style.outline = 'none'` ao focar.
5. Fechamento: `npx prettier --write src/hooks/useRouteFocus.ts`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/hooks/useRouteFocus.ts` e `git commit -m "04-012: foco no h1 e título a cada rota"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Carga inicial **não** move o foco.
- [ ] Navegar de `/` para `/carrinho` foca o `<h1>`; navegar de `/?q=a` para `/?q=b` **não** move o foco.
- [ ] Com `<h1>` oculto por CSS no mesmo documento, o foco vai para o visível.
- [ ] `document.title` = "Carrinho | Kurio" em `/carrinho` e "Kurio" em `/`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto no 04-033 (foco e título).
