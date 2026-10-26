# 06-071 — Contador do carrinho no `AppShell`

**Status:** concluído
**Ordem de execução:** logo **depois do 06-070** (sequência 06-069, 06-070, 06-071; depois segue o 06-028).
**Fluxo / subitem:** Início › 8 (contador do cabeçalho = total de unidades)
**Depende de:** 06-070, 06-026, 04-030, 04-022, 04-027

## Objetivo
Ligar o `Header` e a barra mobile ao total de unidades do carrinho (hoje `cartCount={0}` fixo).

## Arquivos
- alterar: `src/components/layout/AppShell.tsx`

## Referências
- docs/decisoes.md (fase 04: "contador do carrinho no mobile só no `aria-label`"; "Contador do cabeçalho: total de unidades") e docs/design/telas/README.md (inconsistência corrigida: contador = total de unidades)
- `src/components/layout/Header.tsx` (`cartCount`: badge e `aria-label` "Carrinho, N itens"), `src/components/layout/MobileTabBar.tsx` (`cartCount`: só no `aria-label`), `src/hooks/useCart.ts`

## Instruções
1. No `AppShell`: `const { data: cart } = useCart()` e `const cartCount = cart?.itemCount ?? 0`.
2. Passar `cartCount` ao `Header` (no lugar do `0`) e ao `MobileTabBar` (nova prop `cartCount={cartCount}`). Não mudar mais nada (o `useCart` já foi chamado depois do `usePendingExecutors()` do 06-026; manter os dois hooks no topo).
3. Fechamento: `npx prettier --write src/components/layout/AppShell.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/AppShell.tsx` e `git commit -m "06-071: contador do carrinho no AppShell"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] Desktop: o badge do cabeçalho mostra o total de **unidades** (adicionar 2× o mesmo NFT → "2"; 100 ou mais → "99+"); sem itens, sem badge; `aria-label` "Carrinho, 2 itens".
- [ ] Mobile: sem contador visual; `aria-label` do link do carrinho com o total.
- [ ] A falha de `GET /cart` não quebra o cabeçalho (fica sem badge).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e -- layout` pode precisar de ajuste (feito no 06-058). Coberto no 06-063.
