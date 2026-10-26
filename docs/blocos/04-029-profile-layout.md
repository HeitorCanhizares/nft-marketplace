# 04-029 — ProfileLayout

**Status:** pendente
**Fluxo / subitem:** Fase 04 › Layout (Perfil e Carteiras)
**Depende de:** 04-011, 04-028

## Objetivo
Criar o layout do Perfil e das Carteiras: menu lateral à esquerda e conteúdo à direita no desktop; só o conteúdo no mobile. Ligar o layout à rota `/perfil`.

## Arquivos
- criar: `src/components/layout/ProfileLayout.tsx`
- alterar: `src/routes/perfil.tsx`

## Referências
- docs/design/componentes.md (`ProfileLayout`: PE, CT) e docs/fluxos/perfil.md (subitem 1: mobile sem menu lateral)
- Capturas: desktop-perfil.png e desktop-carteiras.png (menu em `x` 120–430; conteúdo começa em `x` 458 e vai até 1320)

## Instruções
1. `ProfileLayout({ children })`: `div.container-page` com `lg:grid lg:grid-cols-[310px_1fr] lg:items-start lg:gap-7` (310 px de menu + 28 px de espaço = conteúdo em `x` 458). `ProfileSidebar` (com `className="max-lg:hidden"`) na primeira coluna e `children` na segunda (`min-w-0`).
2. O `onSignOut` do `ProfileSidebar` vem de `useSignOut()` (04-011), chamado dentro do `ProfileLayout`.
3. `src/routes/perfil.tsx`: trocar o `Outlet` provisório por `component: () => <ProfileLayout><Outlet /></ProfileLayout>` e **manter** `staticData: { footer: false }`. Remover o comentário "04-029 troca o Outlet".
4. O espaço acima do conteúdo (32 px abaixo do cabeçalho) é do `AppShell` (04-030), não do `ProfileLayout`.
5. Fechamento: `npx prettier --write` nos 2 arquivos; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0. Commit: `git add src/components/layout/ProfileLayout.tsx src/routes/perfil.tsx src/routeTree.gen.ts` (só se mudou) e `git commit -m "04-029: ProfileLayout"`.

## Critérios de aceite
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `ProfileLayout`.
- [ ] Desktop: menu de 310 px, conteúdo a 28 px dele; mobile: sem menu lateral e o conteúdo ocupa a largura toda do container.
- [ ] Conteúdo com texto ou tabela larga não estoura a coluna (`min-w-0`).
- [ ] Um único `main` na página (o do `AppShell`).

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- Probe **não commitado** em `/perfil/dados` (1440×900 e 414×896) e captura sobreposta a `desktop-perfil.png`; sem rolagem horizontal em 1024 px.
