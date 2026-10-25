# 00-014 — Prettier

**Status:** pendente
**Fluxo / subitem:** Fase 00 › Prettier
**Depende de:** 00-013

## Objetivo
Configurar o Prettier (com ordenação de classes do Tailwind) e formatar o código existente.

## Arquivos
- criar: `.prettierrc.json`, `.prettierignore`
- alterar: `package.json` (scripts `format` e `format:check`)
- formatação mecânica (não conta no limite): os arquivos de código que o Prettier reescrever

## Referências
- Config aprovada pelo usuário em 2026-10-25: aspas simples, sem ponto e vírgula, 100 colunas

## Instruções
1. `npm install -D prettier prettier-plugin-tailwindcss`.
2. `.prettierrc.json`: `semi: false`, `singleQuote: true`, `printWidth: 100`, `endOfLine: "lf"`, `plugins: ["prettier-plugin-tailwindcss"]`, `tailwindStylesheet: "./src/styles/globals.css"` (Tailwind v4), `tailwindFunctions: ["cn", "cva"]`.
3. `.prettierignore`: `docs`, `node_modules`, `dist`, `package-lock.json`, `src/routeTree.gen.ts`, `playwright-report`, `test-results`, `.lighthouseci`, `public/mockServiceWorker.js`, `components.json`.
4. Scripts: `format` → `prettier --write .`; `format:check` → `prettier --check .`.
5. Rodar `npm run format`. Se o Prettier alterar arquivos do shadcn (`src/lib/utils.ts`, `globals.css`) ou de blocos anteriores, aceitar: é só formatação.
6. Se o Git avisar sobre CRLF/LF, **parar e avisar** (não criar `.gitattributes` sem perguntar).
7. Commit: `git add -A -- .prettierrc.json .prettierignore package.json package-lock.json src eslint.config.js vite.config.ts index.html tsconfig.json tsconfig.app.json tsconfig.node.json` e `git commit -m "00-014: Prettier"`.

## Critérios de aceite
- [ ] `npm run format:check` e `npm run lint` com exit 0.
- [ ] `docs/` intocado.
- [ ] O commit contém só formatação mais os 3 arquivos listados.

## Verificação (Sonnet)
- `npm run format:check && npm run lint && npm run typecheck && npm run build` → exit 0.
- `git diff --stat HEAD~1`: conferir que as mudanças fora dos 3 arquivos são só espaços, aspas e ordem de classes.
- `git status --short` limpo.
