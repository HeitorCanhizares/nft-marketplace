# 05-029 — Página Home provisória (para ficar atrás do modal)

**Status:** pendente
**Fluxo / subitem:** Login/Cadastro › 1 (modal sobre a Início)
**Depende de:** 04-007
**Depende de decisão:** pergunta 2 do relatório da fase 05 (a Início real é da fase 06)

## Objetivo
Tirar o conteúdo provisório da rota `/` para um componente de página (`pages/Home`), para o Login e o Cadastro o renderizarem atrás do modal. A fase 06 troca o conteúdo pelo da Início de verdade.

## Arquivos
- criar: `src/pages/Home/Home.tsx`
- alterar: `src/routes/index.tsx`

## Referências
- docs/arquitetura/rotas.md (Login e Cadastro: "a página renderiza o conteúdo de fundo do Figma (Início) e, por cima, um Dialog") e docs/arquitetura/pastas.md (`pages/`: uma pasta por tela)
- `src/routes/index.tsx` (hoje `component: () => <h1>Kurio</h1>`, `validateSearch` provisório)

## Instruções
1. `Home.tsx`: `export function Home() { return <h1>Kurio</h1> }` — o **mesmo** conteúdo de hoje. Comentário: "fase 06 troca pelo conteúdo da Início; o SignIn e o SignUp a renderizam atrás do modal (sem filtros: o fundo mostra a Início padrão)".
2. `routes/index.tsx`: `component: Home`; `staticData` e `validateSearch` **não mudam**.
3. Fechamento: `npx prettier --write src/pages/Home/Home.tsx src/routes/index.tsx`; `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `git status` mostra o `routeTree.gen.ts` sem mudanças. Commit: `git add src/pages/Home/Home.tsx src/routes/index.tsx` e `git commit -m "05-029: página Home provisória"`.

## Critérios de aceite
- [ ] `/` continua mostrando `<h1>Kurio</h1>` com a barra mobile (mesmo comportamento de antes).
- [ ] `tests/e2e/smoke.spec.ts` e `layout.spec.ts` continuam verdes.
- [ ] Sem `any`, sem `@ts-ignore`; export nomeado `Home`.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0; `npm run test:e2e` verde.
