# 04-006 — Dados estáticos de rota (título, rodapé, barra inferior)

**Status:** concluído
**Fluxo / subitem:** Fase 04 › Base de layout
**Depende de:** 03-020

## Objetivo
Permitir que cada rota diga ao `AppShell` se mostra o rodapé, se mostra a barra inferior mobile e qual é o título do documento, usando o `staticData` do TanStack Router.

## Arquivos
- alterar: `src/app/router.tsx`
- criar: `src/hooks/useRouteChrome.ts`

## Referências
- docs/design/componentes.md (`Footer`: IN, DE, CA, PG d; `MobileTabBar`: IN m)
- docs/arquitetura/rotas.md (foco no `<h1>` e título do documento a cada troca de rota)

## Instruções
1. `router.tsx`: dentro do `declare module '@tanstack/react-router'` existente, acrescentar ao lado do `Register`:
   ```ts
   interface StaticDataRouteOption {
     title?: string        // título do documento: "<title> | Kurio"; sem título, só "Kurio"
     footer?: boolean      // padrão true (só desktop)
     mobileTabBar?: boolean // padrão false
   }
   ```
   Não mudar mais nada em `router.tsx` neste bloco.
2. `useRouteChrome.ts`: exportar `type RouteChrome = { title: string | undefined; footer: boolean; mobileTabBar: boolean }` e `useRouteChrome(): RouteChrome`. Lê as rotas ativas com `useMatches` e, para cada campo, usa o valor da rota **mais profunda** que o define (a folha vence o layout). Fazer **uma chamada de `useMatches` por campo, com `select` devolvendo um valor primitivo** (string/boolean), para não criar objeto novo a cada render. Padrões: `footer: true`, `mobileTabBar: false`, `title: undefined`.
3. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/app/router.tsx src/hooks/useRouteChrome.ts` e `git commit -m "04-006: staticData de rota e useRouteChrome"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`.
- [ ] `Register` do router continua intacto.
- [ ] `useRouteChrome` não devolve um objeto novo a cada render quando nada mudou.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Coberto pelos testes de rodapé, barra inferior e título no 04-033.
