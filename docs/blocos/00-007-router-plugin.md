# 00-007 — TanStack Router: plugin e rotas por arquivo

**Status:** pendente
**Fluxo / subitem:** Fase 00 › TanStack Router (plugin, rotas por arquivo)
**Depende de:** 00-006

## Objetivo
Instalar o TanStack Router com o plugin do Vite (rotas por arquivo, `autoCodeSplitting`) e criar a rota raiz e a rota `/` mínimas.

## Arquivos
- alterar: `vite.config.ts`
- criar: `src/routes/__root.tsx`, `src/routes/index.tsx`
- gerado pelo plugin (não conta no limite, **é versionado**): `src/routeTree.gen.ts`

## Referências
- docs/arquitetura/rotas.md (tabela; `__root.tsx` = layout; `index.tsx` = `/`)
- docs/qualidade/lighthouse.md (`autoCodeSplitting`)

## Instruções
1. `npm install @tanstack/react-router` e `npm install -D @tanstack/router-plugin`.
2. `vite.config.ts`: importar `tanstackRouter` de `@tanstack/router-plugin/vite` e usar `tanstackRouter({ target: 'react', autoCodeSplitting: true })`. **Deve vir antes** do plugin do React em `plugins`.
3. `src/routes/__root.tsx`: `createRootRoute` cujo componente renderiza apenas `<Outlet />`. Sem layout, header, 404 ou erro (fase 04).
4. `src/routes/index.tsx`: `createFileRoute('/')` com componente temporário que renderiza `<h1>Kurio</h1>`. É um placeholder; a fase 06 troca pelo `Home`.
5. Gerar o `routeTree.gen.ts` rodando `npm run build` (ou `npm run dev` por alguns segundos) e conferir que o arquivo apareceu em `src/`.
6. Commit: `git add package.json package-lock.json vite.config.ts src/routes src/routeTree.gen.ts` e `git commit -m "00-007: TanStack Router com rotas por arquivo"`.

## Critérios de aceite
- [ ] `src/routeTree.gen.ts` existe e está no commit.
- [ ] Só `__root.tsx` e `index.tsx` em `src/routes/`.
- [ ] `tanstackRouter` antes de `react()` em `vite.config.ts`.
- [ ] Não há `createRouter` nem `RouterProvider` ainda.

## Verificação (Sonnet)
- `npm run typecheck && npm run build` → exit 0 (typecheck passa com o `routeTree.gen.ts` versionado).
- `git status --short` limpo após rodar `npm run dev` por alguns segundos (o arquivo gerado não muda).
