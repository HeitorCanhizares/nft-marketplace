# 04-009 — Rotas provisórias (3/4): layout e páginas do perfil

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Rotas provisórias
**Depende de:** 04-008

## Objetivo
Criar `/perfil` (layout), `/perfil` (menu) e `/perfil/dados` como placeholders.

## Arquivos
- criar: `src/routes/perfil.tsx`, `src/routes/perfil.index.tsx`, `src/routes/perfil.dados.tsx`
- gerado pelo plugin (versionado): `src/routeTree.gen.ts`

## Referências
- docs/arquitetura/rotas.md (`perfil.tsx` = layout; `perfil.index.tsx` = menu no mobile, redireciona no desktop; `perfil.dados.tsx`)
- docs/fluxos/perfil.md (subitem 1)

## Instruções
1. `perfil.tsx`: `createFileRoute('/perfil')` com `component: Outlet` (de `@tanstack/react-router`) e `staticData: { footer: false }` (as capturas do Perfil não têm rodapé). Comentário "04-029 troca o Outlet pelo ProfileLayout".
2. `perfil.index.tsx`: `createFileRoute('/perfil/')`, `<h1>Meu perfil</h1>`, `staticData: { title: 'Meu perfil', mobileTabBar: true }` (a aba Perfil da barra mobile leva para cá); comentário "fase 09 troca pelo ProfileMenu (mobile) e redireciona para /perfil/dados no desktop".
3. `perfil.dados.tsx`: `/perfil/dados`, `<h1>Dados do perfil</h1>`, `staticData: { title: 'Dados do perfil' }`; comentário "fase 09 troca pelo Profile".
4. Os `<h1>` seguem o padrão do 04-007. **Sem** proteção de rota (fase 05) e **sem** redirecionamento (fase 09).
5. `npx vite build` para regenerar o `routeTree.gen.ts`.
6. Fechamento: `npx prettier --write` nos 3 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/routes src/routeTree.gen.ts` e `git commit -m "04-009: rotas provisórias do perfil"`.

## Critérios de aceite
- [ ] `Link to="/perfil"` e `Link to="/perfil/dados"` compilam.
- [ ] `/perfil` mostra "Meu perfil" e `/perfil/dados` mostra "Dados do perfil".

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
