# 00-004 — Ponto de entrada mínimo

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Vite + React + TypeScript
**Depende de:** 00-002, 00-003

## Objetivo
Ter um `src/main.tsx` que monta o React, para que `typecheck`, `build` e `dev` passem pela primeira vez.

## Arquivos
- criar: `src/main.tsx`

## Referências
- docs/arquitetura/pastas.md (`main.tsx`: ponto de entrada)

## Instruções
1. Criar `src/main.tsx`: `createRoot` em `#root` dentro de `StrictMode`, renderizando um único `<h1>Kurio</h1>`.
2. Se `#root` não existir, lançar um erro claro.
3. **Não** iniciar o MSW, nem criar `App.tsx`, providers ou CSS. O MSW nasce na fase 02; os providers, na 03.
4. Este conteúdo é temporário: o 00-008 troca o `<h1>` pelo `RouterProvider`.
5. Commit: `git add src/main.tsx` e `git commit -m "00-004: ponto de entrada mínimo"`.

## Critérios de aceite
- [ ] `npm run typecheck`, `npm run build` e `npm run build:test` terminam sem erro (o `build:test` ainda não tem `.env.test`; deve passar mesmo assim).
- [ ] `npm run dev` abre em `http://localhost:5173` mostrando "Kurio".
- [ ] Nenhum arquivo além de `src/main.tsx`.

## Verificação (Sonnet)
- `npm run typecheck && npm run build` → exit 0.
- `npm run dev` em segundo plano; abrir no navegador embutido: `<h1>Kurio</h1>` visível, console sem erros.
- Conferir `lang="pt-BR"` e `<title>Kurio</title>` no DOM.
