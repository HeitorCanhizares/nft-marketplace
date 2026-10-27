# 09-009 — `UnsavedChangesGuard`

**Status:** concluído
**Fluxo / subitem:** Perfil › 7 (alterações não salvas)
**Depende de:** 09-001

## Objetivo
Bloquear a navegação com formulário alterado (diálogo) e a saída da aba (aviso nativo).

## Arquivos
- criar: `src/components/shared/UnsavedChangesGuard.tsx`

## Referências
- docs/fluxos/perfil.md (subitem 7); docs/design/componentes.md (`UnsavedChangesGuard`; reutilizado em Carteiras, fase 10)
- `src/components/ui/dialog.tsx`, `button.tsx`; `useBlocker` do `@tanstack/react-router` (v1.170)

## Instruções
1. Props: `{ when: boolean }`.
2. `useBlocker({ shouldBlockFn: () => when, enableBeforeUnload: () => when, withResolver: true })`. **Antes de usar, conferir nos tipos instalados** os nomes `shouldBlockFn`, `enableBeforeUnload` e `withResolver`, e os campos devolvidos (`status`, `proceed`, `reset`); se diferirem, **parar e perguntar**.
3. Com `status === 'blocked'`: `Dialog` aberto com título "Descartar alterações?", descrição "Você tem alterações que ainda não foram salvas.", botões "Descartar" (`proceed()`) e "Continuar editando" (`reset()`). Fechar pelo X/Esc/fora = `reset()`. Foco inicial em "Continuar editando".
4. Fechamento: prettier; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `09-009: UnsavedChangesGuard`.

## Critérios de aceite
- [ ] Com `when={false}` nada bloqueia; com `true`, trocar de rota abre o diálogo e "Continuar editando" mantém a página e os valores.
- [ ] Acessibilidade: título e descrição associados; foco preso e devolvido; teclado completo.
- [ ] Sem `ref` no render; sem cor hexadecimal fora dos tokens.

## Verificação (Sonnet)
- format:check, lint, typecheck, build. Comportamento exercitado pelo spec do 09-014.
