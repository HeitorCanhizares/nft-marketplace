# 13-014 — `PageHeader` compartilhado: criar e aplicar no Carrinho

**Status:** pendente (aguarda a pergunta Q6; sem OK, o `PageHeader` duplicado continua como está)
**Responsável:** Haiku
**Depende de:** Q6
**Toca:** `src/components/layout/PageHeader.tsx` (**novo**, só com o OK da Q6), `src/pages/Cart/Cart.tsx`
**Paralelo:** não: o 13-015 usa o componente criado aqui.
**Lote:** C

## Objetivo
Existem 4 `PageHeader` locais quase iguais (`Cart.tsx`, `Profile.tsx`, `Wallets.tsx`, `OrderConfirmation.tsx`): no mobile, `MobileTopBar` com título e (às vezes) voltar; no desktop, breadcrumb + `h1` `sr-only` ou só `h1` `sr-only`. Unificar num componente de `components/layout/`.

## Contrato proposto do componente
```ts
type PageHeaderProps = {
  title: string
  isDesktop: boolean
  breadcrumb?: BreadcrumbEntry[]   // desktop; ausente = só o h1 sr-only
  backTo?: LinkProps               // mobile; repassado ao MobileTopBar
  fallbackTo?: LinkProps
  action?: ReactNode               // mobile
}
```
Comportamento: `!isDesktop` → `<MobileTopBar title backTo fallbackTo action />`; desktop → `<Breadcrumb items className="mb-2.5" />` (se houver) e `<h1 className="sr-only max-lg:hidden">`. Sem hook de API, sem `useIsDesktop` interno (recebe `isDesktop` por prop, como hoje). Exportação nomeada, um componente por arquivo.

## Instruções
1. Criar `PageHeader.tsx` com o contrato acima. Ler os 4 locais antes e **conferir que a união cobre os 4** (o de Wallets recebe `redirect` e monta `backTo`; o de Cart tem `BREADCRUMB` e `TITLE`).
2. No `Cart.tsx`, apagar o `PageHeader` local e usar o novo (`title="Carrinho"`, breadcrumb existente). Comportamento visual idêntico.
3. `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build`. Commit só dos 2 arquivos.

## Critérios de aceite
- [ ] Carrinho (carregando, erro, vazio e cheio) idêntico ao anterior; `npm run test:e2e -- cart cart-a11y --project=desktop --project=mobile` verde e `tests/visual/cart.spec.ts` sem diferença.
- [ ] `components/layout/` não importa de `hooks`/`services`.

## Para o Opus
Registrar `PageHeader` em `docs/arquitetura/pastas.md` (exemplos de `layout/`) e em `docs/design/componentes.md`.
